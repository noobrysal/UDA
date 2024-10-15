from django.urls import path
from .views import ActivationView, TokenValidationView

urlpatterns = [
    path('auth/activate/<uidb64>/<token>/', ActivationView.as_view(), name='activation'),
    path('auth/token/verify/', TokenValidationView.as_view(), name='token_verify'),
]