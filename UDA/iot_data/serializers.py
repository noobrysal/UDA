from rest_framework import serializers
from .models import AirQuality, SoilQuality, WaterQuality

# Serializer for AirQuality model
class AirQualitySerializer(serializers.ModelSerializer):
    class Meta:
        model = AirQuality
        fields = '__all__'  # or list specific fields like ['pm2_5', 'pm10', ...]

# Serializer for SoilQuality model
class SoilQualitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SoilQuality
        fields = '__all__'

# Serializer for WaterQuality model
class WaterQualitySerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterQuality
        fields = '__all__'
