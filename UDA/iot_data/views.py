from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import AirQuality, SoilQuality, WaterQuality
from .serializers import AirQualitySerializer, SoilQualitySerializer, WaterQualitySerializer

# Viewset for AirQuality
class AirQualityViewSet(viewsets.ModelViewSet):
    queryset = AirQuality.objects.all()
    serializer_class = AirQualitySerializer

    def retrieve(self, request, pk=None):
        try:
            air_quality = self.get_object()  # Retrieve the object
            serializer = self.get_serializer(air_quality)  # Serialize the object
            return Response(serializer.data)  # Return serialized data
        except AirQuality.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

# Viewset for SoilQuality
class SoilQualityViewSet(viewsets.ModelViewSet):
    queryset = SoilQuality.objects.all()
    serializer_class = SoilQualitySerializer

    def retrieve(self, request, pk=None):
        try:
            soil_quality = self.get_object()
            serializer = self.get_serializer(soil_quality)
            return Response(serializer.data)
        except SoilQuality.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

# Viewset for WaterQuality
class WaterQualityViewSet(viewsets.ModelViewSet):
    queryset = WaterQuality.objects.all()
    serializer_class = WaterQualitySerializer

    def retrieve(self, request, pk=None):
        try:
            water_quality = self.get_object()
            serializer = self.get_serializer(water_quality)
            return Response(serializer.data)
        except WaterQuality.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
