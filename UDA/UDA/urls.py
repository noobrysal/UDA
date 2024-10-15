
from django.contrib import admin
from django.urls import path, include
from authentication.views import ActivationView, LogoutView

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', include('authentication.urls')),
    path('', include('iot_data.urls')),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.authtoken')),
    path('auth/activate/<uidb64>/<token>/', ActivationView.as_view(), name='activation'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
]
    