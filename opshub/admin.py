from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Utilisateurs, Role, Permission, RolePermission,
    Equipe, OutilTeam, OutilMonitoring, Service,
    MotsClesAssignation, Plainte, Feedback, Recommandation, Shift, Ticket
)


@admin.register(Utilisateurs)
class UtilisateursAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Informations complémentaires', {'fields': ('adresse', 'role', 'statut')}),
    )
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']


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


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    inlines = [RolePermissionInline]
    list_display = ['nom', 'description']


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['code', 'description']