from django import forms
from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import OutilMonitoring, Service, MotsClesAssignation, TeamLead, Administrateur, MembreTechcommand,Recommandation,Feedback,Plainte,OutilTeam
class OutilMonitoringForm(forms.ModelForm):
    class Meta:
        model = OutilMonitoring
        fields = ['nom','lien_acces', 'necessite_authentification', 'statut','outil_team']

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


        from .models import Feedback, Recommandation, Plainte

class FeedbackForm(forms.ModelForm):
    class Meta:
        model = Feedback
        fields = ['description', 'shift']


class RecommandationForm(forms.ModelForm):
    class Meta:
        model = Recommandation
        fields = ['contenu']


class PlainteForm(forms.ModelForm):
    class Meta:
        model = Plainte
        fields = ['contenu', 'anonyme']

class OutilTeamForm(forms.ModelForm):
    class Meta:
        model = OutilTeam
        fields = ['nom', 'nom_point_de_contact', 'contact_point_de_contact', 'nom_manager', 'contact_manager']        