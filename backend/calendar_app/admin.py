from django.contrib import admin
from .models import ChronoGroup, Event, EventTemplate

# Register your models here.
admin.site.register(ChronoGroup)
admin.site.register(Event)
admin.site.register(EventTemplate)
