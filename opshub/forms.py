from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import (
    Utilisateurs, OutilMonitoring, Service, MotsClesAssignation,
    Recommandation, Feedback, Plainte, OutilTeam, Equipe
)


class OutilMonitoringForm(forms.ModelForm):
    class Meta:
        model = OutilMonitoring
        fields = ['nom', 'lien_acces', 'necessite_authentification', 'statut', 'outil_team']


class ServiceForm(forms.ModelForm):
    class Meta:
        model = Service
        fields = ['nom', 'description', 'outils_monitoring']


class MotsClesAssignationForm(forms.ModelForm):
    class Meta:
        model = MotsClesAssignation
        fields = ['intitule', 'equipe']


class UtilisateurCreationForm(UserCreationForm):
    class Meta:
        model = Utilisateurs
        fields = ['username', 'first_name', 'last_name', 'email', 'adresse', 'role']


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
        fields = ['nom', 'nom_point_de_contact', 'contact_point_de_contact', 'mail_point_de_contact', 'nom_manager', 'contact_manager', 'mail_manager']


class EquipeForm(forms.ModelForm):
    class Meta:
        model = Equipe
        fields = ['nom', 'description', 'nbr_membres']


class ProfilForm(forms.ModelForm):
    class Meta:
        model = Utilisateurs
        fields = ['username', 'first_name', 'last_name', 'email', 'adresse']


class TicketImportForm(forms.Form):
    fichier = forms.FileField(label="Fichier Excel des tickets")