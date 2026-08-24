from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from opshub.models import Incident


class Command(BaseCommand):
    help = "Envoie un rappel par mail aux owners des incidents sans RCA fourni, tous les 2 jours"

    def handle(self, *args, **options):
        maintenant = timezone.now()
        seuil = maintenant - timedelta(days=2)

        incidents_a_relancer = Incident.objects.filter(
            statut_rca=Incident.StatutRCA.NOT_PROVIDED,
            owner_email__isnull=False,
        ).exclude(owner_email='')

        incidents_a_relancer = [
            i for i in incidents_a_relancer
            if i.dernier_rappel_envoye is None or i.dernier_rappel_envoye <= seuil
        ]

        if not incidents_a_relancer:
            self.stdout.write("Aucun incident à relancer aujourd'hui.")
            return

        for incident in incidents_a_relancer:
            try:
                send_mail(
                    subject=f"Rappel RCA requis — Incident {incident.incident_id}",
                    message=(
                        f"Bonjour,\n\n"
                        f"Le RCA de l'incident {incident.incident_id} n'a pas encore été fourni.\n"
                        f"Description : {incident.description}\n"
                        f"Sévérité : {incident.severite}\n\n"
                        f"Merci de le fournir dans les meilleurs délais.\n\n"
                        f"— OpsHub, MTN Bénin"
                    ),
                    from_email=None,
                    recipient_list=[incident.owner_email],
                    fail_silently=False,
                )
                incident.dernier_rappel_envoye = maintenant
                incident.save(update_fields=['dernier_rappel_envoye'])
                self.stdout.write(self.style.SUCCESS(f"Mail envoyé pour {incident.incident_id} → {incident.owner_email}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Échec pour {incident.incident_id} : {e}"))