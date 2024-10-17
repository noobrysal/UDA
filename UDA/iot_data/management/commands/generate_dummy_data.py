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

        # Get the current date
        current_date = datetime.now()

        # Get the first and last day of the current month
        start_date = current_date.replace(day=1)
        end_date = (start_date + timedelta(days=31)).replace(day=1) - timedelta(days=1)

        air_quality_data = []
        soil_quality_data = []
        water_quality_data = []

        # Generate dummy data for each day of the month
        for single_date in (start_date + timedelta(n) for n in range((end_date - start_date).days + 1)):
            for hour in [0, 4, 8, 12, 16, 20]:  # 6 intervals: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
                timestamp = single_date.replace(hour=hour, minute=0, second=0)

                # Generate AirQuality data
                air_quality_data.append(AirQuality(
                    pm2_5=random.uniform(10, 50),
                    pm10=random.uniform(20, 80),
                    humidity=random.uniform(30, 90),
                    temperature=random.uniform(15, 35),
                    oxygen=random.uniform(19, 21),
                    co2=random.uniform(300, 500),
                    timestamp=timestamp.replace(microsecond=0) # Use the generated timestamp
                ))

                # Generate SoilQuality data
                soil_quality_data.append(SoilQuality(
                    device_id=f"Device_{random.randint(1, 10)}",
                    soil_moisture=random.uniform(10, 40),
                    temperature=random.uniform(15, 35),
                    humidity=random.uniform(20, 70),
                    battery_level=random.uniform(50, 100),
                    timestamp=timestamp.replace(microsecond=0)  # Use the generated timestamp
                ))

                # Generate WaterQuality data
                water_quality_data.append(WaterQuality(
                    turbidity=random.uniform(1, 5),
                    temperature=random.uniform(10, 30),
                    ph=random.uniform(6, 9),
                    tds=random.uniform(100, 400),
                    timestamp=timestamp.replace(microsecond=0)  # Use the generated timestamp
                ))

        # Insert the data
        AirQuality.objects.bulk_create(air_quality_data)
        SoilQuality.objects.bulk_create(soil_quality_data)
        WaterQuality.objects.bulk_create(water_quality_data)

        self.stdout.write(self.style.SUCCESS('Dummy data generated successfully!'))
