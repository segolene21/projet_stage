from django.contrib.auth.models import AbstractUser
from django.db import models


class Permission(models.Model):
    class Code(models.TextChoices):
        GERER_OUTILS = 'gerer_outils', 'Créer, modifier, supprimer un outil de monitoring'
        CONSULTER_OUTILS = 'consulter_outils', 'Consulter le catalogue des outils'
        GERER_SERVICES = 'gerer_services', 'Créer, modifier, supprimer un service'
        CONSULTER_SERVICES = 'consulter_services', 'Consulter la liste des services'
        GERER_MOTS_CLES = 'gerer_mots_cles', 'Créer, modifier, supprimer un mot-clé et son équipe'
        CONSULTER_MOTS_CLES = 'consulter_mots_cles', 'Consulter les mots-clés d\'assignation'
        GERER_UTILISATEURS = 'gerer_utilisateurs', 'Créer, modifier, supprimer un utilisateur'
        GERER_ROLES = 'gerer_roles', 'Créer/modifier les rôles et leurs permissions'
        SOUMETTRE_FEEDBACK = 'soumettre_feedback', 'Soumettre un feedback/plainte/recommandation'
        CONSULTER_FEEDBACK = 'consulter_feedback', 'Consulter les feedbacks/plaintes/recommandations'
        SUPPRIMER_FEEDBACK_TOUS = 'supprimer_feedback_tous', 'Supprimer n\'importe quelle contribution'
        SUPPRIMER_FEEDBACK_PROPRE = 'supprimer_feedback_propre', 'Supprimer ses propres contributions'
        GERER_TICKETS = 'gerer_tickets', 'Importer, modifier, ajouter feedback, supprimer un ticket'
        CONSULTER_TICKETS = 'consulter_tickets', 'Consulter et télécharger les tickets'
        GERER_INCIDENTS = 'gerer_incidents', 'Importer, modifier, ajouter RCA, supprimer un incident'
        CONSULTER_INCIDENTS = 'consulter_incidents', 'Consulter et télécharger les incidents' 

    code = models.CharField(max_length=50, unique=True, choices=Code.choices)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.get_code_display()


class Role(models.Model):
    class Nom(models.TextChoices):
        ADMINISTRATEUR = 'administrateur', 'Administrateur'
        TEAMLEAD = 'teamlead', 'Team-lead'
        MEMBRE_TECHCOMMAND = 'membre_techcommand', 'Membre Techcommand'
        SENIOR_MANAGER = 'senior_manager', 'Senior Manager'
        MANAGER = 'manager', 'Manager'

    nom = models.CharField(max_length=50, unique=True, choices=Nom.choices)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, through="RolePermission", related_name="roles")

    def __str__(self):
        return self.get_nom_display()

    def a_la_permission(self, code_permission):
        return self.permissions.filter(code=code_permission).exists()
    
    

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role} — {self.permission}"


class Utilisateurs(AbstractUser):
    adresse = models.CharField(max_length=255, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="utilisateurs")
    statut = models.BooleanField(default=True)
    theme_sombre = models.BooleanField(default=False)

    def a_la_permission(self, code_permission):
        """Vérifie si l'utilisateur possède une permission donnée."""
        if self.is_superuser:
            return True
        return self.role and self.role.a_la_permission(code_permission)

    def a_le_role(self, code_role):
        """Vérifie si l'utilisateur a un rôle spécifique."""
        if self.is_superuser:
            return True
        return self.role and self.role.nom == code_role

    @property
    def is_administrateur(self):
        return self.is_superuser or self.a_la_permission(Permission.Code.GERER_UTILISATEURS)

    @property
    def is_teamlead(self):
        return self.is_superuser or self.a_la_permission(Permission.Code.GERER_OUTILS)

    @property
    def is_membre_techcommand(self):
        return self.is_superuser or self.a_la_permission(Permission.Code.SOUMETTRE_FEEDBACK)

    @property
    def is_senior_manager(self):
        return self.is_superuser or self.a_la_permission(Permission.Code.GERER_INCIDENTS)

    @property
    def is_manager(self):
        return self.is_superuser or self.a_le_role(Role.Nom.MANAGER)


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
    nom = models.CharField(max_length=100)
    statut = models.BooleanField(default=True)
    lien_acces = models.CharField(max_length=225)
    necessite_authentification = models.BooleanField(default=False)
    outil_team = models.ForeignKey(OutilTeam, on_delete=models.CASCADE)

    def __str__(self):
        return f"Outil monitoring #{self.id} — {self.nom}"


class Service(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    outils_monitoring = models.ManyToManyField(OutilMonitoring, related_name="services")

    def __str__(self):
        return self.nom


class MotsClesAssignation(models.Model):
    intitule = models.CharField(max_length=100)
    equipe = models.ForeignKey(Equipe, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.intitule


class Plainte(models.Model):
    contenu = models.TextField()
    date_ajout = models.DateTimeField(auto_now_add=True)
    anonyme = models.BooleanField(default=False)
    membre = models.ForeignKey(Utilisateurs, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Plainte du {self.date_ajout.date()}"


class Feedback(models.Model):
    description = models.TextField()
    date_soumission = models.DateField(auto_now_add=True)
    membre = models.ForeignKey(Utilisateurs, on_delete=models.SET_NULL, null=True)
    shift = models.ForeignKey("Shift", on_delete=models.CASCADE)

    def __str__(self):
        return f"Feedback #{self.id} — {self.date_soumission}"


class Recommandation(models.Model):
    contenu = models.TextField()
    date_soumission = models.DateField(auto_now_add=True)
    membre = models.ForeignKey(Utilisateurs, on_delete=models.SET_NULL, null=True)

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


class ImportLot(models.Model):
    titre = models.CharField(max_length=150)
    cree_le = models.DateTimeField(auto_now_add=True)
    cree_par = models.ForeignKey(
        "Utilisateurs", on_delete=models.SET_NULL, null=True, blank=True, related_name="imports_tickets"
    )

    def __str__(self):
        return self.titre


class Ticket(models.Model):
    import_lot = models.ForeignKey(ImportLot, on_delete=models.CASCADE, related_name="tickets")
    ticket_id = models.CharField(max_length=50, verbose_name="ID")
    state = models.CharField(max_length=50, verbose_name="State")
    requester = models.CharField(max_length=150, verbose_name="Requester")
    details = models.TextField(verbose_name="Details")
    feedback = models.TextField(blank=True, null=True, verbose_name="Feedback")
    cree_le = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    modifie_le = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        unique_together = ("import_lot", "ticket_id")

    def __str__(self):
        return self.ticket_id

class ImportIncidents(models.Model):
    titre = models.CharField(max_length=150)
    cree_le = models.DateTimeField(auto_now_add=True)
    cree_par = models.ForeignKey(
        "Utilisateurs", on_delete=models.SET_NULL, null=True, blank=True, related_name="imports_incidents"
    )

    def __str__(self):
        return self.titre

class Incident(models.Model):
    class StatutRCA(models.TextChoices):
        PROVIDED = 'provided', 'Provided'
        NOT_PROVIDED = 'not_provided', 'Not Provided'

    import_lot = models.ForeignKey(ImportIncidents, on_delete=models.CASCADE, related_name="incidents")
    incident_id = models.CharField(max_length=100, verbose_name="ID")
    description = models.TextField(verbose_name="Issue Description")
    date_signalement = models.DateTimeField(null=True, blank=True, verbose_name="Reported Date")
    severite = models.CharField(max_length=10, blank=True, verbose_name="Severity")
    impact = models.TextField(blank=True, verbose_name="Impact")
    affected_service = models.TextField(blank=True, verbose_name="Affected Service")
    root_cause = models.TextField(blank=True, verbose_name="Root Cause")
    action_resolution = models.TextField(blank=True, verbose_name="Action for Resolution")
    duree = models.DurationField(null=True, blank=True, verbose_name="Duration")
    statut_rca = models.CharField(max_length=20, choices=StatutRCA.choices, blank=True, verbose_name="RCA Status")

    owner_email = models.EmailField(blank=True, null=True, verbose_name="Email du owner")
    rca_fichier = models.FileField(upload_to='rca/', blank=True, null=True, verbose_name="RCA (PDF)")

    dernier_rappel_envoye = models.DateTimeField(null=True, blank=True)

    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("import_lot", "incident_id")

    def __str__(self):
        return self.incident_id

    @property
    def rca_present(self):
        return bool(self.rca_fichier)