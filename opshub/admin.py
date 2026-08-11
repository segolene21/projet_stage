from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Utilisateurs, Administrateur, TeamLead, MembreTechcommand,
    Equipe, OutilTeam, OutilMonitoring, Service,
    MotsClesAssignation, Plainte, Feedback, Recommandation, Shift,Ticket
)

admin.site.register(Administrateur, UserAdmin)
admin.site.register(TeamLead, UserAdmin)
admin.site.register(MembreTechcommand, UserAdmin)

admin.site.register(Equipe)
admin.site.register(OutilTeam)
admin.site.register(OutilMonitoring)
admin.site.register(Service)
admin.site.register(MotsClesAssignation)
admin.site.register(Plainte)
admin.site.register(Feedback)
admin.site.register(Recommandation)
admin.site.register(Shift)
admin.site.register(Ticket)