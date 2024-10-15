from django.contrib import admin
from .models import AirQuality, SoilQuality, WaterQuality

class AirQualityAdmin(admin.ModelAdmin):
    list_display = ('id', 'pm2_5', 'pm10', 'humidity', 'temperature', 'oxygen', 'co2', 'timestamp')

class SoilQualityAdmin(admin.ModelAdmin):
    list_display = ('id', 'device_id', 'soil_moisture', 'temperature', 'humidity', 'battery_level', 'timestamp')

class WaterQualityAdmin(admin.ModelAdmin):
    list_display = ('id', 'turbidity', 'temperature', 'ph', 'tds', 'timestamp')

# Registering the models with the customized admin classes
admin.site.register(AirQuality, AirQualityAdmin)
admin.site.register(SoilQuality, SoilQualityAdmin)
admin.site.register(WaterQuality, WaterQualityAdmin)
