from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AirQualityViewSet, SoilQualityViewSet, WaterQualityViewSet

router = DefaultRouter()
router.register(r'air-quality', AirQualityViewSet, basename='airquality')
router.register(r'soil-quality', SoilQualityViewSet, basename='soilquality')
router.register(r'water-quality', WaterQualityViewSet, basename='waterquality')

urlpatterns = [
    path('', include(router.urls)),
]
