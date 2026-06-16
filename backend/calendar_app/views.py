from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import ChronoGroup, Event, EventTemplate
from .serializers import ChronoGroupSerializer, EventSerializer, EventTemplateSerializer, UserSerializer

class ChronoGroupViewSet(viewsets.ModelViewSet):
    serializer_class = ChronoGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return groups the user is a member of
        return self.request.user.chrono_groups.all().order_by('-created_at')

    def perform_create(self, serializer):
        # Set creator and add creator as the first member
        group = serializer.save(created_by=self.request.user)
        group.members.add(self.request.user)

    @action(detail=False, methods=['post'])
    def join(self, request):
        invite_code = request.data.get('invite_code', '').strip().upper()
        if not invite_code:
            return Response({'error': '招待コードを入力してください。'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            group = ChronoGroup.objects.get(invite_code=invite_code)
        except ChronoGroup.DoesNotExist:
            return Response({'error': '無効な招待コードです。'}, status=status.HTTP_404_NOT_FOUND)

        if group.members.filter(id=request.user.id).exists():
            return Response({'error': 'すでにこのグループのメンバーです。'}, status=status.HTTP_400_BAD_REQUEST)
        
        group.members.add(request.user)
        serializer = self.get_serializer(group)
        return Response(serializer.data, status=status.HTTP_200_OK)

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter events by groups the user belongs to
        queryset = Event.objects.filter(group__members=self.request.user).distinct()
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset.order_by('start_time')

    def perform_create(self, serializer):
        # Ensure the user is a member of the group they are adding the event to
        group = serializer.validated_data.get('group')
        if not group.members.filter(id=self.request.user.id).exists():
            raise permissions.exceptions.PermissionDenied("このグループのメンバーではありません。")
        serializer.save(created_by=self.request.user)

class EventTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = EventTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter templates by groups the user belongs to
        queryset = EventTemplate.objects.filter(group__members=self.request.user).distinct()
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        # Ensure the user is a member of the group
        group = serializer.validated_data.get('group')
        if not group.members.filter(id=self.request.user.id).exists():
            raise permissions.exceptions.PermissionDenied("このグループのメンバーではありません。")
        serializer.save(created_by=self.request.user)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
