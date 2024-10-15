from django.db import models

# Air Quality Model
class AirQuality(models.Model):
    pm2_5 = models.FloatField()
    pm10 = models.FloatField()
    humidity = models.FloatField()
    temperature = models.FloatField()
    oxygen = models.FloatField()
    co2 = models.FloatField()
    timestamp = models.DateTimeField()  # Manually set the timestamp

    def __str__(self):
        return f"Air Quality at {self.timestamp}"
    
    class Meta:
        ordering = ['timestamp','id']

# Soil Quality Model
class SoilQuality(models.Model):
    device_id = models.CharField(max_length=50)
    timestamp = models.DateTimeField()  # Manually set the timestamp
    soil_moisture = models.FloatField()
    temperature = models.FloatField()
    humidity = models.FloatField()
    battery_level = models.FloatField()

    def __str__(self):
        return f"Soil Quality from Device {self.device_id} at {self.timestamp}"
    
    class Meta:
        ordering = ['timestamp','id']

# Water Quality Model
class WaterQuality(models.Model):
    turbidity = models.FloatField()
    temperature = models.FloatField()
    ph = models.FloatField()
    tds = models.FloatField()
    timestamp = models.DateTimeField()  # Manually set the timestamp

    def __str__(self):
        return f"Water Quality at {self.timestamp}"
    
    class Meta:
        ordering = ['timestamp','id']
