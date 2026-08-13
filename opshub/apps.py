from django.apps import AppConfig
from django.db.models.signals import post_migrate


def creer_roles_et_permissions(sender, **kwargs):
    # Import à l'intérieur de la fonction pour éviter les imports prématurés
    from .models import Role, Permission

    # 1. Création/Mise à jour des permissions depuis l'Enum Permission.Code
    for code, description in Permission.Code.choices:
        Permission.objects.get_or_create(code=code, defaults={'description': description})

    # 2. Rôle Administrateur (toutes les permissions)
    r_admin, _ = Role.objects.get_or_create(
        nom=Role.Nom.ADMINISTRATEUR,
        defaults={'description': 'Administrateur du système'}
    )
    r_admin.permissions.set(Permission.objects.filter(code__in=[
        Permission.Code.GERER_UTILISATEURS,
        Permission.Code.CONSULTER_OUTILS,
        Permission.Code.CONSULTER_SERVICES,
        Permission.Code.CONSULTER_MOTS_CLES,
        Permission.Code.CONSULTER_FEEDBACK,
    
    ]))

    # 3. Rôle Team-Lead
    r_teamlead, _ = Role.objects.get_or_create(
        nom=Role.Nom.TEAMLEAD,
        defaults={'description': 'Chef d\'équipe Tech'}
    )
    r_teamlead.permissions.set(Permission.objects.filter(code__in=[
        Permission.Code.GERER_OUTILS,
        Permission.Code.CONSULTER_OUTILS,
        Permission.Code.GERER_SERVICES,
        Permission.Code.CONSULTER_SERVICES,
        Permission.Code.GERER_MOTS_CLES,
        Permission.Code.CONSULTER_MOTS_CLES,
        Permission.Code.CONSULTER_FEEDBACK,
        Permission.Code.SUPPRIMER_FEEDBACK_TOUS,
    ]))

    # 4. Rôle Membre Techcommand
    r_membre, _ = Role.objects.get_or_create(
        nom=Role.Nom.MEMBRE_TECHCOMMAND,
        defaults={'description': 'Membre de l\'équipe Techcommand'}
    )
    r_membre.permissions.set(Permission.objects.filter(code__in=[
        Permission.Code.CONSULTER_OUTILS,
        Permission.Code.CONSULTER_SERVICES,
        Permission.Code.CONSULTER_MOTS_CLES,
        Permission.Code.SOUMETTRE_FEEDBACK,
        Permission.Code.CONSULTER_FEEDBACK,
        Permission.Code.SUPPRIMER_FEEDBACK_PROPRE,
    ]))


class OpshubConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'opshub'

    def ready(self):
        post_migrate.connect(creer_roles_et_permissions, sender=self)