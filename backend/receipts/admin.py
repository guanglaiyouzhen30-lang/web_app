from django.contrib import admin
from .models import Category, Receipt, ReceiptItem
# Register your models here.

admin.site.register(Category)
admin.site.register(Receipt)
admin.site.register(ReceiptItem)
