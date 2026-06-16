from django.db import models
from django.contrib.auth.models import User
import uuid

def generate_invite_code():
    # Generate a unique 8-character invite code
    return str(uuid.uuid4())[:8].upper()

class ChronoGroup(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    invite_code = models.CharField(max_length=12, unique=True, default=generate_invite_code)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    members = models.ManyToManyField(User, related_name='chrono_groups')

    def __str__(self):
        return self.name

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    group = models.ForeignKey(ChronoGroup, on_delete=models.CASCADE, related_name='events')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_events')
    color = models.CharField(max_length=7, default='#22d3ee')  # Hex code for UI customization (defaults to Cyan)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class EventTemplate(models.Model):
    name = models.CharField(max_length=100)  # Name of the template itself (e.g. "Weekly Standup")
    title_template = models.CharField(max_length=200)  # Default title of created events
    description_template = models.TextField(blank=True)  # Default description of created events
    default_duration_minutes = models.PositiveIntegerField(default=60)
    group = models.ForeignKey(ChronoGroup, on_delete=models.CASCADE, related_name='templates')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
