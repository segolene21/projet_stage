from django import forms
from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import OutilMonitoring, Service, MotsClesAssignation, TeamLead, Administrateur, MembreTechcommand
class OutilMonitoringForm(forms.ModelForm):
    class Meta:
        model = OutilMonitoring
        fields = ['nom','lien_acces', 'necessite_authentification', 'statut']

class ServiceForm(forms.ModelForm):
    class Meta:
        model = Service
        fields = ['nom', 'description', 'outils_monitoring']

class MotsClesAssignationForm(forms.ModelForm):
    class Meta:
        model = MotsClesAssignation
        fields = ['intitule', 'equipe']


        from django.contrib.auth.forms import UserCreationForm

class TeamLeadForm(UserCreationForm):
    class Meta:
        model = TeamLead
        fields = ['username', 'first_name', 'last_name', 'email', 'adresse']


class MembreTechcommandForm(UserCreationForm):
    class Meta:
        model = MembreTechcommand
        fields = ['username', 'first_name', 'last_name', 'email', 'adresse']


class AdministrateurForm(UserCreationForm):
    class Meta:
        model = Administrateur
        fields = ['username', 'first_name', 'last_name', 'email', 'adresse']