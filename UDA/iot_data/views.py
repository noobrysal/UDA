from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import AirQuality, SoilQuality, WaterQuality
from .serializers import AirQualitySerializer, SoilQualitySerializer, WaterQualitySerializer
from django.utils.dateparse import parse_date

# Viewset for AirQuality
class AirQualityViewSet(viewsets.ModelViewSet):
    serializer_class = AirQualitySerializer
    authentication_classes = []
    permission_classes = []

    def get_queryset(self):
        queryset = AirQuality.objects.all()

        # Get 'month' query parameter
        month = self.request.query_params.get('month')
        date_param = self.request.query_params.get('date')

        if date_param:
            date = parse_date(date_param)
            if date:
                # Filter by date if date_param is provided
                queryset = queryset.filter(
                    timestamp__year=date.year,
                    timestamp__month=date.month,
                    timestamp__day=date.day
                )
        elif month:
            month_date = parse_date(month)
            if month_date:
                # Filter by year and month if month_param is provided
                queryset = queryset.filter(
                    timestamp__year=month_date.year,
                    timestamp__month=month_date.month
                )

        return queryset

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
