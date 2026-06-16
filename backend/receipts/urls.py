from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ReceiptViewSet, ReceiptUploadView, ReceiptSummaryView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'list', ReceiptViewSet, basename='receipt')

urlpatterns = [
    path('upload/', ReceiptUploadView.as_view(), name='receipt-upload'),
    path('summary/', ReceiptSummaryView.as_view(), name='receipt-summary'),
    path('', include(router.urls)),
]