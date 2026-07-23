from django.contrib import admin
from .models import (
    Utilisateurs, Administrateur, TeamLead, MembreTechcommand,
    Equipe, OutilTeam, OutilMonitoring, Service,
    MotsClesAssignation, Plainte, Feedback, Recommandation, Shift
)

admin.site.register(Utilisateurs)
admin.site.register(Administrateur)
admin.site.register(TeamLead)
admin.site.register(MembreTechcommand)
admin.site.register(Equipe)
admin.site.register(OutilTeam)
admin.site.register(OutilMonitoring)
admin.site.register(Service)
admin.site.register(MotsClesAssignation)
admin.site.register(Plainte)
admin.site.register(Feedback)
admin.site.register(Recommandation)
admin.site.register(Shift)