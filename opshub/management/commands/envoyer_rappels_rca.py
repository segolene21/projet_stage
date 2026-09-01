from django.core.management.base import BaseCommand
from django.core.mail import EmailMessage
from django.utils import timezone
from datetime import timedelta
from opshub.models import Incident, ConfigurationRappels


class Command(BaseCommand):
    help = "Envoie un rappel par mail aux owners des incidents sans RCA fourni, selon la fréquence configurée"

    def handle(self, *args, **options):
        maintenant = timezone.now()
        frequence_jours = ConfigurationRappels.get_frequence()
        seuil = maintenant - timedelta(days=frequence_jours)

        incidents_a_relancer = Incident.objects.filter(
            statut_rca=Incident.StatutRCA.NOT_PROVIDED,
            owner_email__isnull=False,
        ).exclude(owner_email='')

        incidents_a_relancer = [
            i for i in incidents_a_relancer
            if i.dernier_rappel_envoye is None or i.dernier_rappel_envoye <= seuil
        ]

        if not incidents_a_relancer:
            self.stdout.write(f"Aucun incident à relancer aujourd'hui (fréquence : {frequence_jours} jour(s)).")
            return

        for incident in incidents_a_relancer:
            destinataires_copie = []
            if incident.cc_emails:
                destinataires_copie = [e.strip() for e in incident.cc_emails.split(',') if e.strip()]

            try:
                message = EmailMessage(
                    subject=f"Rappel RCA requis — Incident {incident.incident_id}",
                    body=(
                        f"Bonjour,\n\n"
                        f"Le RCA de l'incident {incident.incident_id} n'a pas encore été fourni.\n"
                        f"Description : {incident.description}\n"
                        f"Sévérité : {incident.severite}\n\n"
                        f"Merci de le fournir dans les meilleurs délais.\n\n"
                        f"— OpsHub, MTN Bénin"
                    ),
                    to=[incident.owner_email],
                    cc=destinataires_copie,
                )
                message.send(fail_silently=False)

                incident.dernier_rappel_envoye = maintenant
                incident.save(update_fields=['dernier_rappel_envoye'])
                self.stdout.write(self.style.SUCCESS(
                    f"Mail envoyé pour {incident.incident_id} → {incident.owner_email} (cc: {', '.join(destinataires_copie) or 'aucun'})"
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Échec pour {incident.incident_id} : {e}"))