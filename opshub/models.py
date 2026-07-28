from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateurs(AbstractUser):
    adresse = models.CharField(max_length=255, blank=True)


class Administrateur(Utilisateurs):
    class Meta:
        verbose_name = "Administrateur"
        verbose_name_plural = "Administrateurs"


class TeamLead(Utilisateurs):
    class Meta:
        verbose_name = "Team-lead"
        verbose_name_plural = "Team-leads"


class MembreTechcommand(Utilisateurs):
    statut = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Membre Techcommand"
        verbose_name_plural = "Membres Techcommand"


class Equipe(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    nbr_membres = models.IntegerField()

    def __str__(self):
        return self.nom


class OutilTeam(models.Model):
    nom = models.CharField(max_length=100)
    nom_point_de_contact = models.CharField(max_length=100)
    contact_point_de_contact = models.CharField(max_length=100)
    nom_manager = models.CharField(max_length=100)
    contact_manager = models.CharField(max_length=100)

    def __str__(self):
        return self.nom


class OutilMonitoring(models.Model):
    nom = models.CharField(max_length=100, null=True, blank=True)
    statut = models.BooleanField(default=True)
    lien_acces = models.URLField()
    necessite_authentification = models.BooleanField(default=False)
    outil_team = models.ForeignKey("OutilTeam", on_delete=models.CASCADE)

    def __str__(self):
        return f"Outil monitoring #{self.id}"


class Service(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    outils_monitoring = models.ManyToManyField(
        OutilMonitoring,
        related_name="services"
    )

    def __str__(self):
        return self.nom


class MotsClesAssignation(models.Model):
    intitule = models.CharField(max_length=100)
    equipe = models.ForeignKey("Equipe", on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.intitule


class Plainte(models.Model):
    contenu = models.TextField()
    date_ajout = models.DateTimeField(auto_now_add=True)
    anonyme = models.BooleanField(default=False)
    membre = models.ForeignKey("MembreTechcommand", on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Plainte du {self.date_ajout.date()}"


class Feedback(models.Model):
    description = models.TextField()
    date_soumission = models.DateField(auto_now_add=True)
    membre = models.ForeignKey("MembreTechcommand", on_delete=models.SET_NULL, null=True)
    shift = models.ForeignKey("Shift", on_delete=models.CASCADE)

    def __str__(self):
        return f"Feedback #{self.id} — {self.date_soumission}"


class Recommandation(models.Model):
    contenu = models.TextField()
    date_soumission = models.DateField(auto_now_add=True)
    membre = models.ForeignKey("MembreTechcommand", on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Recommandation #{self.id}"


class Shift(models.Model):
    PLAGE_CHOICES = [
        ('matin', 'Matin'),
        ('apres_midi', 'Après-midi'),
        ('nuit', 'Nuit'),
    ]
    date = models.DateField()
    plage = models.CharField(max_length=15, choices=PLAGE_CHOICES)

    class Meta:
        unique_together = ('date', 'plage')

    def __str__(self):
        return f"{self.date} — {self.get_plage_display()}"
