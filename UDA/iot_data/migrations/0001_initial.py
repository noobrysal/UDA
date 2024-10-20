# Generated by Django 4.1.1 on 2024-10-14 05:43

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AirQuality',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('pm2_5', models.FloatField()),
                ('pm10', models.FloatField()),
                ('humidity', models.FloatField()),
                ('temperature', models.FloatField()),
                ('oxygen', models.FloatField()),
                ('co2', models.FloatField()),
                ('timestamp', models.DateTimeField()),
            ],
        ),
        migrations.CreateModel(
            name='SoilQuality',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('device_id', models.CharField(max_length=50)),
                ('timestamp', models.DateTimeField()),
                ('soil_moisture', models.FloatField()),
                ('temperature', models.FloatField()),
                ('humidity', models.FloatField()),
                ('battery_level', models.FloatField()),
            ],
        ),
        migrations.CreateModel(
            name='WaterQuality',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('turbidity', models.FloatField()),
                ('temperature', models.FloatField()),
                ('ph', models.FloatField()),
                ('tds', models.FloatField()),
                ('timestamp', models.DateTimeField()),
            ],
        ),
    ]
