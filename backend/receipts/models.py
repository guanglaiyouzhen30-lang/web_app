from django.db import models
import uuid

# Create your models here.
class Category(models.Model):

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, unique=True, verbose_name='カテゴリ名')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
    def __str__(self):
        return self.name
    
class Receipt(models.Model):

    class Meta:
        db_table = 'receipts'
        ordering = ['-date', '-created_at']

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='店舗名')
    date = models.DateField(verbose_name='購入日')
    total_amount = models.IntegerField(verbose_name='合計金額')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='登録日時')

    def __str__(self):
        return f'{self.date} - {self.store_name} - {self.total_amount}'
    
class ReceiptItem(models.Model):

    class Meta:
        db_table = 'receipt_items'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # レシートが削除されたら、その明細も一緒に削除する (CASCADE)
    receipt = models.ForeignKey(
        Receipt, 
        on_delete=models.CASCADE, 
        related_name='items', 
        verbose_name="レシート"
    )
    
    # カテゴリが削除されても明細は残し、「未分類」にできるように null=True / SET_NULL に設定
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True, 
        related_name='items', 
        verbose_name="カテゴリ"
    )
    
    item_name = models.CharField(max_length=255, verbose_name="品目名")
    price = models.IntegerField(verbose_name="金額")

    def __str__(self):
        return f"{self.item_name} ({self.price}円) - {self.category.name if self.category else '未分類'}"