from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChronoGroupViewSet, EventViewSet, EventTemplateViewSet, UserViewSet

router = DefaultRouter()
router.register(r'groups', ChronoGroupViewSet, basename='group')
router.register(r'events', EventViewSet, basename='event')
router.register(r'templates', EventTemplateViewSet, basename='template')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]
