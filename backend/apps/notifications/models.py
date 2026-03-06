from django.db import models
from apps.accounts.models import User

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    link = models.CharField(max_length=255, null=True, blank=True)
    
    # Types: info, success, warning, error, quiz, notes
    category = models.CharField(max_length=20, default='info')
    
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.email} - {self.title}"
