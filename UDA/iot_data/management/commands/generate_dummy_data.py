import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from iot_data.models import AirQuality, SoilQuality, WaterQuality
from django.db import connection

class Command(BaseCommand):
    help = 'Generate dummy data for Air, Soil, and Water Quality models'

    def handle(self, *args, **kwargs):
        # Clear previous dummy data
        AirQuality.objects.all().delete()
        SoilQuality.objects.all().delete()
        WaterQuality.objects.all().delete()

        # Reset auto-increment IDs for SQLite
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM sqlite_sequence WHERE name='iot_data_airquality';")
            cursor.execute("DELETE FROM sqlite_sequence WHERE name='iot_data_soilquality';")
            cursor.execute("DELETE FROM sqlite_sequence WHERE name='iot_data_waterquality';")

        def sequential_timestamps(start, end, count):
            delta = (end - start) / count
            return [(start + i * delta).replace(microsecond=0) for i in range(count)]

        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now()

        # Generate sequential timestamps without milliseconds
        timestamps = sequential_timestamps(start_date, end_date, 50)

        air_quality_data = []
        soil_quality_data = []
        water_quality_data = []

        # Generate AirQuality data
        for i in range(15):
            air_quality_data.append(AirQuality(
                pm2_5=random.uniform(10, 50),
                pm10=random.uniform(20, 80),
                humidity=random.uniform(30, 90),
                temperature=random.uniform(15, 35),
                oxygen=random.uniform(19, 21),
                co2=random.uniform(300, 500),
                timestamp=timestamps[i]  # Use sequential timestamp
            ))

        # Generate SoilQuality data
        for i in range(15):
            soil_quality_data.append(SoilQuality(
                device_id=f"Device_{random.randint(1, 10)}",
                soil_moisture=random.uniform(10, 40),
                temperature=random.uniform(15, 35),
                humidity=random.uniform(20, 70),
                battery_level=random.uniform(50, 100),
                timestamp=timestamps[i]  # Use sequential timestamp
            ))

        # Generate WaterQuality data
        for i in range(15):
            water_quality_data.append(WaterQuality(
                turbidity=random.uniform(1, 5),
                temperature=random.uniform(10, 30),
                ph=random.uniform(6, 9),
                tds=random.uniform(100, 400),
                timestamp=timestamps[i]  # Use sequential timestamp
            ))

        # Insert the data
        AirQuality.objects.bulk_create(air_quality_data)
        SoilQuality.objects.bulk_create(soil_quality_data)
        WaterQuality.objects.bulk_create(water_quality_data)

        self.stdout.write(self.style.SUCCESS('Dummy data generated successfully!'))
