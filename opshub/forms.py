from django import forms
from .models import OutilMonitoring,Service

class OutilMonitoringForm(forms.ModelForm):
    class Meta:
        model = OutilMonitoring
        fields = ['nom','lien_acces', 'necessite_authentification', 'statut']

class ServiceForm(forms.ModelForm):
    class Meta:
        model = Service
        fields = ['nom', 'description', 'outils_monitoring']