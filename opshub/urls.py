from django.urls import path
from . import views

urlpatterns = [
    path('outils/', views.liste_outils, name='liste_outils'),
    path('outils/<int:outil_id>/', views.detail_outil, name='detail_outil'),
    path('outils/ajouter/', views.ajouter_outil, name='ajouter_outil'),
    path('outils/<int:outil_id>/modifier/', views.modifier_outil, name='modifier_outil'),
    path('outils/<int:outil_id>/supprimer/', views.supprimer_outil, name='supprimer_outil'),
    path('services/', views.liste_services, name='liste_services'),
    path('services/<int:service_id>/', views.detail_service, name='detail_service'),
    path('services/ajouter/', views.ajouter_service, name='ajouter_service'),
    path('services/<int:service_id>/modifier/', views.modifier_service, name='modifier_service'),
    path('services/<int:service_id>/supprimer/', views.supprimer_service, name='supprimer_service'),
]