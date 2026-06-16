from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChronoGroup, Event, EventTemplate

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'first_name']

    def get_avatar(self, obj):
        # Return the first character of the username as a simple avatar
        return obj.username[0].upper() if obj.username else 'U'

class ChronoGroupSerializer(serializers.ModelSerializer):
    members_details = UserSerializer(source='members', many=True, read_only=True)
    
    class Meta:
        model = ChronoGroup
        fields = ['id', 'name', 'description', 'invite_code', 'members', 'members_details', 'created_by']
        read_only_fields = ['invite_code', 'created_by', 'members']

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'start_time', 'end_time', 'group', 'created_by', 'color']
        read_only_fields = ['created_by']

class EventTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventTemplate
        fields = ['id', 'name', 'title_template', 'description_template', 'default_duration_minutes', 'group', 'created_by']
        read_only_fields = ['created_by']
