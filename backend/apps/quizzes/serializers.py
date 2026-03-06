from rest_framework import serializers
from .models import Quiz, Question, Choice, QuizAttempt, AttemptAnswer

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text', 'is_correct')

class SecureChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text')

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'quiz', 'text', 'image', 'points', 'order', 'choices')
        read_only_fields = ('quiz',)

class SecureQuestionSerializer(serializers.ModelSerializer):
    choices = SecureChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'image', 'points', 'order', 'choices')

class QuizSerializer(serializers.ModelSerializer):
    subject_name = serializers.ReadOnlyField(source='subject.name')
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    teacher_name = serializers.ReadOnlyField(source='teacher.get_full_name')
    my_attempt = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ('id', 'title', 'subject', 'subject_name', 'teacher', 'teacher_name', 
                  'start_time', 'end_time', 'deadline', 'duration', 'is_extracted', 
                  'question_count', 'raw_file', 'my_attempt')
        read_only_fields = ('teacher', 'is_extracted')

    def get_my_attempt(self, obj):
        request = self.context.get('request')
        if request and request.user.role == 'STUDENT':
            attempt = obj.attempts.filter(student=request.user).first()
            if attempt:
                return {
                    'id': attempt.id,
                    'is_submitted': attempt.is_submitted,
                    'score': attempt.score,
                    'can_retake': attempt.can_retake
                }
        return None

class QuizDetailSerializer(serializers.ModelSerializer):
    questions = SecureQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ('id', 'title', 'duration', 'questions')

class AttemptAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.ReadOnlyField(source='question.text')
    selected_choice_text = serializers.ReadOnlyField(source='selected_choice.text')
    correct_choice_text = serializers.SerializerMethodField()

    class Meta:
        model = AttemptAnswer
        fields = ('id', 'question', 'question_text', 'selected_choice', 'selected_choice_text', 'is_correct', 'correct_choice_text')

    def get_correct_choice_text(self, obj):
        correct = obj.question.choices.filter(is_correct=True).first()
        return correct.text if correct else None

class QuizAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.get_full_name')
    student_id = serializers.ReadOnlyField(source='student.student_profile.student_id')
    answers = AttemptAnswerSerializer(many=True, read_only=True)
    quiz_title = serializers.ReadOnlyField(source='quiz.title')

    class Meta:
        model = QuizAttempt
        fields = ('id', 'student', 'student_name', 'student_id', 'quiz', 'quiz_title', 'start_time', 'end_time', 'score', 'is_submitted', 'auto_submitted', 'answers')
        read_only_fields = ('student', 'score', 'start_time')
