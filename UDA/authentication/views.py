from rest_framework.views import APIView
from django.http.response import JsonResponse
from .models import CustomUser
from django.http.response import Http404
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework import status
from djoser.views import TokenDestroyView

class ActivationView(APIView):
    authentication_classes = []
    permission_classes = [IsAuthenticatedOrReadOnly]
    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = get_object_or_404(CustomUser, pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({'status': 'Activation link is invalid'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'status': 'Account activated'}, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'Activation link is invalid'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.session.flush()
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

class CustomTokenDestroyView(TokenDestroyView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return response
    
class TokenValidationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'detail': 'Token is valid'}, status=status.HTTP_200_OK)