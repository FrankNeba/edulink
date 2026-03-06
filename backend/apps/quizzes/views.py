from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Quiz, Question, Choice, QuizAttempt, AttemptAnswer
from .serializers import (
    QuizSerializer, QuizDetailSerializer, QuestionSerializer, 
    ChoiceSerializer, QuizAttemptSerializer
)
from .services import QuizExtractionService
from apps.accounts.views import IsVicePrincipal, IsHOD, IsTeacher, IsStudent
from apps.notifications.models import Notification

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            qs = Quiz.objects.filter(subject__students=user)
        elif user.role == 'TEACHER':
            from django.db.models import Q
            qs = Quiz.objects.filter(
                Q(teacher=user) |
                Q(subject__teachers=user) |
                Q(subject__academic_level__class_master=user)
            ).distinct()
        elif user.role in ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD']:
            qs = Quiz.objects.all()
        else:
            qs = Quiz.objects.none()
            
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
            
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'extract']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        quiz = serializer.save(teacher=self.request.user)
        # Notify students
        students = quiz.subject.students.all()
        for student in students:
            Notification.objects.create(
                recipient=student,
                title=f"New Quiz: {quiz.title}",
                message=f"A new assessment has been published for {quiz.subject.name}. Start date: {quiz.start_time.strftime('%Y-%m-%d %H:%M')}",
                category="quiz",
                link='/dashboard/quizzes'
            )

    @action(detail=True, methods=['post'])
    def extract(self, request, pk=None):
        import traceback
        quiz = self.get_object()
        if not quiz.raw_file:
            return Response({'error': 'No file uploaded for this quiz.'}, status=status.HTTP_400_BAD_REQUEST)

        service = QuizExtractionService()
        try:
            # Pass the FieldFile object; service.extract_from_file handles
            # both local paths and Supabase URLs transparently.
            extracted_data = service.extract_from_file(quiz.raw_file)
            service.save_extracted_quiz(quiz.id, extracted_data)
            return Response({'message': f'Quiz extracted successfully. {len(extracted_data)} questions saved.'})
        except Exception as e:
            tb = traceback.format_exc()
            print(f"[EXTRACTION ERROR] Quiz {pk}: {e}\n{tb}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], serializer_class=QuizDetailSerializer)
    def take(self, request, pk=None):
        quiz = self.get_object()
        # Check if student is registered for the subject
        if request.user.role == 'STUDENT' and not quiz.subject.students.filter(id=request.user.id).exists():
            return Response({'error': 'You are not registered for this subject.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if quiz is currently active
        now = timezone.now()
        if now < quiz.start_time or now > quiz.end_time:
            return Response({'error': 'Quiz is not active.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create or get attempt
        attempt, created = QuizAttempt.objects.get_or_create(student=request.user, quiz=quiz)
        
        if attempt.is_submitted and not attempt.can_retake:
            return Response({'error': 'You have already submitted this quiz. No retakes allowed without approval.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if attempt.can_retake:
            # Reset attempt for retake
            attempt.is_submitted = False
            attempt.can_retake = False # One-time use
            attempt.score = 0
            attempt.save()
            
        return Response(self.get_serializer(quiz).data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        try:
            attempt = QuizAttempt.objects.get(student=request.user, quiz=quiz)
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if attempt.is_submitted:
            return Response({'error': 'Already submitted.'}, status=status.HTTP_400_BAD_REQUEST)
            
        answers = request.data.get('answers', []) # List of {question_id: id, choice_id: id}
        score = 0
        
        # Clear any previous answers if this is a redo
        attempt.answers.all().delete()
        
        for ans in answers:
            try:
                question = Question.objects.get(id=ans['question_id'], quiz=quiz)
                choice = Choice.objects.get(id=ans['choice_id'], question=question)
                
                is_correct = choice.is_correct
                if is_correct:
                    score += question.points
                
                AttemptAnswer.objects.create(
                    attempt=attempt,
                    question=question,
                    selected_choice=choice,
                    is_correct=is_correct
                )
            except:
                continue
                
        attempt.score = score
        attempt.is_submitted = True
        attempt.end_time = timezone.now()
        attempt.auto_submitted = request.data.get('auto_submitted', False)
        attempt.save()
        
        return Response({'message': 'Quiz submitted.', 'score': score})

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        quiz = self.get_object()
        if request.user.role in ['TEACHER', 'HOD', 'VICE_PRINCIPAL', 'PRINCIPAL']:
            attempts = QuizAttempt.objects.filter(quiz=quiz)
            serializer = QuizAttemptSerializer(attempts, many=True)
            return Response(serializer.data)
        else:
            # Students see their own result
            try:
                attempt = QuizAttempt.objects.get(student=request.user, quiz=quiz)
                serializer = QuizAttemptSerializer(attempt)
                return Response(serializer.data)
            except QuizAttempt.DoesNotExist:
                return Response({'error': 'No attempt found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def attempts(self, request, pk=None):
        quiz = self.get_object()
        attempts = QuizAttempt.objects.filter(quiz=quiz)
        serializer = QuizAttemptSerializer(attempts, many=True)
        return Response(serializer.data)

class QuestionViewSet(viewsets.ModelViewSet):
    """Full CRUD on questions. Teachers can add, edit, and delete questions on their quizzes."""
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

    def get_queryset(self):
        user = self.request.user
        quiz_id = self.request.query_params.get('quiz')
        qs = Question.objects.all()
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        # Teachers can only touch their own quiz questions
        if user.role == 'TEACHER':
            qs = qs.filter(quiz__teacher=user)
        elif user.role == 'STUDENT':
            qs = qs.none()  # Students never edit questions
        return qs.order_by('order')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        quiz_id = self.request.data.get('quiz')
        quiz = Quiz.objects.get(id=quiz_id)
        if self.request.user.role == 'TEACHER' and quiz.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only add questions to your own quizzes.")
        serializer.save()


class ChoiceViewSet(viewsets.ModelViewSet):
    """Full CRUD on choices. Linked to questions owned by the requesting teacher."""
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer

    def get_queryset(self):
        user = self.request.user
        question_id = self.request.query_params.get('question')
        qs = Choice.objects.all()
        if question_id:
            qs = qs.filter(question_id=question_id)
        if user.role == 'TEACHER':
            qs = qs.filter(question__quiz__teacher=user)
        elif user.role == 'STUDENT':
            qs = qs.none()
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]


class QuizAttemptViewSet(viewsets.GenericViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsTeacher]

    @action(detail=True, methods=['post'])
    def allow_retake(self, request, pk=None):
        attempt = self.get_object()
        attempt.can_retake = True
        attempt.save()
        
        # Notify student
        Notification.objects.create(
            recipient=attempt.student,
            title="Retake Authorized",
            message=f"You have been authorized to retake the quiz: {attempt.quiz.title}",
            category="success",
            link='/dashboard/quizzes'
        )
        
        return Response({'message': 'Retake authorized.'})
