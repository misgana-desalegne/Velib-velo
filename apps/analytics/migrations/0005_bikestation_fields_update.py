# Generated migration for BikeStation model field updates

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0004_bikestation_coordinates_weeklyanalytics'),
    ]

    operations = [
        # Rename station_id to stationcode
        migrations.RenameField(
            model_name='bikestation',
            old_name='station_id',
            new_name='stationcode',
        ),
        # Rename total_docks to capacity
        migrations.RenameField(
            model_name='bikestation',
            old_name='total_docks',
            new_name='capacity',
        ),
        # Rename is_active to is_installed
        migrations.RenameField(
            model_name='bikestation',
            old_name='is_active',
            new_name='is_installed',
        ),
        # Change latitude from DecimalField to FloatField
        migrations.AlterField(
            model_name='bikestation',
            name='latitude',
            field=models.FloatField(),
        ),
        # Change longitude from DecimalField to FloatField
        migrations.AlterField(
            model_name='bikestation',
            name='longitude',
            field=models.FloatField(),
        ),
        # Add new fields from data structure
        migrations.AddField(
            model_name='bikestation',
            name='numdocksavailable',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='bikestation',
            name='numbikesavailable',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='bikestation',
            name='mechanical',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='bikestation',
            name='ebike',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='bikestation',
            name='is_renting',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='bikestation',
            name='is_returning',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='bikestation',
            name='duedate',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
