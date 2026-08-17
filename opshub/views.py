from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.contrib import messages
from openpyxl import load_workbook, Workbook

from .models import (
    Utilisateurs, Role, Permission, OutilMonitoring, Service, OutilTeam,
    Feedback, Recommandation, Plainte, Shift, MotsClesAssignation, Equipe, Ticket
)
from .forms import (
    OutilMonitoringForm, ServiceForm, OutilTeamForm, EquipeForm, ProfilForm,
    RecommandationForm, PlainteForm, MotsClesAssignationForm
)
from .decorators import permission_requise


# ==========================================
# GESTION DES OUTILS
# ==========================================

@permission_requise(Permission.Code.CONSULTER_OUTILS, is_json=False)
def liste_outils(request):
    requete = request.GET.get('q', '')
    outils = OutilMonitoring.objects.filter(nom__icontains=requete) if requete else OutilMonitoring.objects.all()
    outils_teams = OutilTeam.objects.all()
    return render(request, 'liste_outils.html', {
        'outils': outils,
        'outils_teams': outils_teams,
        'requete': requete,
    })


@login_required
def detail_outil(request, outil_id):
    outil = get_object_or_404(OutilMonitoring, id=outil_id)
    return render(request, 'detail_outil.html', {'outil': outil})


@csrf_exempt
@permission_requise(Permission.Code.GERER_OUTILS)
def ajouter_outil(request):
    if request.method == 'POST':
        form = OutilMonitoringForm(request.POST)
        if form.is_valid():
            outil = form.save()
            return JsonResponse({'succes': True, 'id': outil.id, 'nom': outil.nom}, status=201)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_OUTILS)
def modifier_outil(request, outil_id):
    outil = get_object_or_404(OutilMonitoring, id=outil_id)
    if request.method == 'POST':
        form = OutilMonitoringForm(request.POST, instance=outil)
        if form.is_valid():
            outil = form.save()
            return JsonResponse({'succes': True, 'id': outil.id, 'nom': outil.nom}, status=200)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_OUTILS)
def supprimer_outil(request, outil_id):
    outil = get_object_or_404(OutilMonitoring, id=outil_id)
    if request.method == 'POST':
        outil.delete()
        return JsonResponse({'succes': True}, status=200)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_OUTILS)
def ajouter_outil_team(request):
    if request.method == 'POST':
        form = OutilTeamForm(request.POST)
        if form.is_valid():
            outil_team = form.save()
            return JsonResponse({'succes': True, 'id': outil_team.id, 'nom': outil_team.nom}, status=201)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def detail_outil_team(request, team_id):
    equipe = get_object_or_404(OutilTeam, id=team_id)
    return render(request, 'detail_outil_team.html', {'equipe': equipe})


# ==========================================
# GESTION DES SERVICES
# ==========================================

@permission_requise(Permission.Code.CONSULTER_SERVICES, is_json=False)
def liste_services(request):
    requete = request.GET.get('q', '')
    outil_id = request.GET.get('outil', '')

    services = Service.objects.all()

    if requete:
        services = services.filter(nom__icontains=requete)

    if outil_id:
        services = services.filter(outils_monitoring__id=outil_id)

    services = services.distinct()

    tous_les_outils = OutilMonitoring.objects.all()

    return render(request, 'liste_services.html', {
        'services': services,
        'tous_les_outils': tous_les_outils,
        'requete': requete,
        'outil_id_selectionne': outil_id,
    })


@login_required
def detail_service(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    return render(request, 'detail_service.html', {'service': service})


@permission_requise(Permission.Code.GERER_SERVICES)
def ajouter_service(request):
    if request.method == "POST":
        form = ServiceForm(request.POST)
        if form.is_valid():
            service = form.save()
            return JsonResponse({"succes": True, "id": service.id, "nom": service.nom})
        return JsonResponse({"succes": False, "erreurs": form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_SERVICES)
def modifier_service(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    if request.method == 'POST':
        form = ServiceForm(request.POST, instance=service)
        if form.is_valid():
            service = form.save()
            return JsonResponse({'succes': True, 'id': service.id, 'nom': service.nom}, status=200)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_SERVICES)
def supprimer_service(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    if request.method == 'POST':
        service.delete()
        return JsonResponse({'succes': True}, status=200)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


# ==========================================
# GESTION DES MOTS-CLÉS & ÉQUIPES
# ==========================================

@permission_requise(Permission.Code.CONSULTER_MOTS_CLES, is_json=False)
def liste_mots_cles(request):
    mots_cles = MotsClesAssignation.objects.all()
    equipes = Equipe.objects.all()
    membres = Utilisateurs.objects.filter(role__nom=Role.Nom.MEMBRE_TECHCOMMAND)
    return render(request, 'liste_mots_cles.html', {
        'mots_cles': mots_cles,
        'equipes': equipes,
        'membres': membres,
    })


@permission_requise(Permission.Code.GERER_MOTS_CLES)
def ajouter_mot_cle(request):
    if request.method == 'POST':
        form = MotsClesAssignationForm(request.POST)
        if form.is_valid():
            mot_cle = form.save()
            return JsonResponse({
                'succes': True,
                'id': mot_cle.id,
                'intitule': mot_cle.intitule,
                'equipe': mot_cle.equipe.nom if mot_cle.equipe else '',
            }, status=201)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_MOTS_CLES)
def ajouter_equipe(request):
    if request.method == 'POST':
        form = EquipeForm(request.POST)
        if form.is_valid():
            equipe = form.save()
            return JsonResponse({'succes': True, 'id': equipe.id, 'nom': equipe.nom}, status=201)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_MOTS_CLES)
def modifier_mot_cle(request, mot_cle_id):
    mot_cle = get_object_or_404(MotsClesAssignation, id=mot_cle_id)
    if request.method == 'POST':
        form = MotsClesAssignationForm(request.POST, instance=mot_cle)
        if form.is_valid():
            mot_cle = form.save()
            return JsonResponse({
                'succes': True,
                'id': mot_cle.id,
                'intitule': mot_cle.intitule,
                'equipe': mot_cle.equipe.nom if mot_cle.equipe else '',
            }, status=200)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_MOTS_CLES)
def supprimer_mot_cle(request, mot_cle_id):
    mot_cle = get_object_or_404(MotsClesAssignation, id=mot_cle_id)
    if request.method == 'POST':
        mot_cle.delete()
        return JsonResponse({'succes': True}, status=200)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


# ==========================================
# GESTION DES UTILISATEURS
# ==========================================

@permission_requise(Permission.Code.GERER_UTILISATEURS, is_json=False)
def liste_utilisateurs(request):
    administrateurs = Utilisateurs.objects.filter(role__nom=Role.Nom.ADMINISTRATEUR)
    teamleads = Utilisateurs.objects.filter(role__nom=Role.Nom.TEAMLEAD)
    membres = Utilisateurs.objects.filter(role__nom=Role.Nom.MEMBRE_TECHCOMMAND)

    return render(request, 'liste-utilisateurs.html', {
        'administrateurs': administrateurs,
        'teamleads': teamleads,
        'membres': membres,
    })


@permission_requise(Permission.Code.GERER_UTILISATEURS)
def ajouter_utilisateur(request):
    if request.method == 'POST':
        form = ProfilForm(request.POST)
        role_id = request.POST.get('role_id')
        role = get_object_or_404(Role, id=role_id) if role_id else None

        if form.is_valid():
            utilisateur = form.save(commit=False)
            utilisateur.role = role
            utilisateur.save()
            return JsonResponse({'succes': True, 'id': utilisateur.id, 'username': utilisateur.username, 'role': role.nom if role else ''}, status=201)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_UTILISATEURS)
def toggle_statut_utilisateur(request, user_id):
    utilisateur = get_object_or_404(Utilisateurs, id=user_id)
    if request.method == 'POST':
        utilisateur.is_active = not utilisateur.is_active
        utilisateur.save()
        return JsonResponse({'succes': True, 'actif': utilisateur.is_active})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.GERER_UTILISATEURS)
def supprimer_utilisateur(request, user_id):
    utilisateur = get_object_or_404(Utilisateurs, id=user_id)
    if request.method == 'POST':
        utilisateur.delete()
        return JsonResponse({'succes': True})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


# ==========================================
# GESTION DES FEEDBACKS / PLAINTES / RECOMMANDATIONS
# ==========================================

@permission_requise(Permission.Code.CONSULTER_FEEDBACK, is_json=False)
def liste_feedbacks(request):
    feedbacks = Feedback.objects.all().order_by('-date_soumission')
    return render(request, 'liste-feedbacks.html', {'feedbacks': feedbacks})


@permission_requise(Permission.Code.CONSULTER_FEEDBACK, is_json=False)
def liste_plaintes(request):
    plaintes = Plainte.objects.all().order_by('-date_ajout')
    return render(request, 'liste-plaintes.html', {'plaintes': plaintes})


@permission_requise(Permission.Code.CONSULTER_FEEDBACK, is_json=False)
def liste_recommandations(request):
    recommandations = Recommandation.objects.all().order_by('-date_soumission')
    return render(request, 'liste-recommandations.html', {'recommandations': recommandations})


@permission_requise(Permission.Code.SOUMETTRE_FEEDBACK)
def ajouter_feedback(request):
    if request.method == 'POST':
        date_shift = request.POST.get('date_shift')
        plage_shift = request.POST.get('plage_shift')
        description = request.POST.get('description')

        if not date_shift or not plage_shift or not description:
            return JsonResponse({'succes': False, 'erreurs': {'champs': ['Tous les champs sont requis']}}, status=400)

        shift, cree = Shift.objects.get_or_create(date=date_shift, plage=plage_shift)

        feedback = Feedback.objects.create(
            shift=shift,
            description=description,
            membre=request.user,
        )

        return JsonResponse({'succes': True, 'description': feedback.description}, status=201)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.SOUMETTRE_FEEDBACK)
def ajouter_recommandation(request):
    if request.method == 'POST':
        form = RecommandationForm(request.POST)
        if form.is_valid():
            recommandation = form.save(commit=False)
            recommandation.membre = request.user
            recommandation.save()
            return JsonResponse({'succes': True, 'contenu': recommandation.contenu}, status=201)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@permission_requise(Permission.Code.SOUMETTRE_FEEDBACK)
def ajouter_plainte(request):
    if request.method == 'POST':
        form = PlainteForm(request.POST)
        if form.is_valid():
            plainte = form.save(commit=False)
            if not plainte.anonyme:
                plainte.membre = request.user
            plainte.save()
            return JsonResponse({'succes': True, 'contenu': plainte.contenu}, status=201)
        return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_feedback(request, feedback_id):
    feedback = get_object_or_404(Feedback, id=feedback_id)
    est_auteur = (feedback.membre == request.user)
    peut_supprimer_tout = request.user.a_la_permission(Permission.Code.SUPPRIMER_FEEDBACK_TOUS)

    if not (est_auteur or peut_supprimer_tout):
        return JsonResponse({'erreur': 'Accès non autorisé'}, status=403)

    if request.method == 'POST':
        feedback.delete()
        return JsonResponse({'succes': True})
    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_recommandation(request, recommandation_id):
    recommandation = get_object_or_404(Recommandation, id=recommandation_id)
    est_auteur = (recommandation.membre == request.user)
    peut_supprimer_tout = request.user.a_la_permission(Permission.Code.SUPPRIMER_FEEDBACK_TOUS)

    if not (est_auteur or peut_supprimer_tout):
        return JsonResponse({'erreur': 'Accès non autorisé'}, status=403)

    if request.method == 'POST':
        recommandation.delete()
        return JsonResponse({'succes': True})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_plainte(request, plainte_id):
    plainte = get_object_or_404(Plainte, id=plainte_id)
    est_auteur = (plainte.membre == request.user)
    peut_supprimer_tout = request.user.a_la_permission(Permission.Code.SUPPRIMER_FEEDBACK_TOUS)

    if not (est_auteur or peut_supprimer_tout):
        return JsonResponse({'erreur': 'Accès non autorisé'}, status=403)

    if request.method == 'POST':
        plainte.delete()
        return JsonResponse({'succes': True})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


# ==========================================
# GESTION DES TICKETS EXCEL & AUTRES VUES
# ==========================================

def index(request):
    return render(request, 'index.html')


def login(request):
    return render(request, 'Login.html')


@login_required
def experiences_membres(request):
    return render(request, 'experiences-membres.html')


@login_required
def parametres(request):
    if request.method == 'POST':
        form = ProfilForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, "Profil mis à jour.")
            return redirect('parametres')
    else:
        form = ProfilForm(instance=request.user)
    return render(request, 'parametres.html', {'form': form})

import json
from openpyxl import load_workbook, Workbook
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.utils import timezone
from django.db.models import Q

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

from .models import Ticket, ImportLot, Permission


@login_required
def page_tickets(request):
    return render(request, 'liste_tickets.html')


@csrf_exempt
def import_tickets_excel(request):
    if not request.user.is_authenticated or not request.user.a_la_permission(Permission.Code.GERER_TICKETS):
        return JsonResponse({"erreur": "Accès interdit"}, status=403)

    if request.method != "POST":
        return JsonResponse({"erreur": "Méthode non autorisée"}, status=405)

    fichier = request.FILES.get("fichier")
    if not fichier:
        return JsonResponse({"erreur": "Aucun fichier reçu"}, status=400)

    titre = request.POST.get("titre", "").strip() or f"Import du {timezone.localtime().strftime('%d/%m/%Y %H:%M')}"

    feedbacks_bruts = request.POST.get("feedbacks", "{}")
    try:
        feedbacks = json.loads(feedbacks_bruts)
    except json.JSONDecodeError:
        feedbacks = {}

    wb = load_workbook(fichier, data_only=True)
    ws = wb.active

    lot = ImportLot.objects.create(titre=titre, cree_par=request.user)

    count = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        ticket_id, state, requester, details = row[:4]
        if not ticket_id:
            continue

        ticket_id_str = str(ticket_id)
        Ticket.objects.create(
            import_lot=lot,
            ticket_id=ticket_id_str,
            state=state or "",
            requester=requester or "",
            details=details or "",
            feedback=feedbacks.get(ticket_id_str, ""),
        )
        count += 1

    return JsonResponse({"message": f"{count} tickets importés", "lot_id": lot.id, "titre": lot.titre})


@login_required
def liste_imports(request):
    """Liste des lots d'import, avec un aperçu (5 premiers tickets) pour chacun."""
    lots = ImportLot.objects.all().order_by('-cree_le')
    resultat = []

    for lot in lots:
        tickets = lot.tickets.all()[:3]
        resultat.append({
            "id": lot.id,
            "titre": lot.titre,
            "cree_le": timezone.localtime(lot.cree_le).strftime("%d/%m/%Y %H:%M"),
            "nombre_tickets": lot.tickets.count(),
            "apercu": [
                {
                    "ticket_id": t.ticket_id, "state": t.state, "requester": t.requester,
                    "details": t.details, "feedback": t.feedback,
                } for t in tickets
            ],
        })

    return JsonResponse(resultat, safe=False)


@login_required
def tickets_du_lot(request, lot_id):
    q = request.GET.get('q', '').strip()

    try:
        lot = ImportLot.objects.get(id=lot_id)
    except ImportLot.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    qs = lot.tickets.all()
    if q:
        qs = qs.filter(
            Q(ticket_id__icontains=q) | Q(state__icontains=q) |
            Q(requester__icontains=q) | Q(details__icontains=q) | Q(feedback__icontains=q)
        )

    tickets = []
    for t in qs:
        tickets.append({
            "id": t.id, "ticket_id": t.ticket_id, "state": t.state, "requester": t.requester,
            "details": t.details, "feedback": t.feedback,
            "modifie_le": timezone.localtime(t.modifie_le).strftime("%d/%m/%Y %H:%M"),
        })

    return JsonResponse({"titre": lot.titre, "tickets": tickets})


def _generer_pdf(tickets, response):
    doc = SimpleDocTemplate(response, pagesize=landscape(A4))
    donnees = [["ID", "State", "Requester", "Details", "Feedback", "Modifié le"]]

    for t in tickets:
        donnees.append([
            t.ticket_id, t.state, t.requester, (t.details or "")[:80], (t.feedback or "")[:60],
            timezone.localtime(t.modifie_le).strftime("%d/%m/%Y %H:%M") if t.modifie_le else "",
        ])

    tableau = Table(donnees, repeatRows=1)
    tableau.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#FFCC00")),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    doc.build([tableau])


@login_required
def export_lot(request, lot_id):
    format_export = request.GET.get('format', 'xlsx')

    try:
        lot = ImportLot.objects.get(id=lot_id)
    except ImportLot.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    tickets = lot.tickets.all()
    nom_base = lot.titre.replace(" ", "_")

    if format_export == 'pdf':
        response = HttpResponse(content_type='application/pdf')
        response["Content-Disposition"] = f'attachment; filename="{nom_base}.pdf"'
        _generer_pdf(tickets, response)
        return response

    wb = Workbook()
    ws = wb.active
    ws.title = "Tickets"
    ws.append(["ID", "State", "Requester", "Details", "Feedback", "Créé le", "Modifié le"])

    for t in tickets:
        ws.append([
            t.ticket_id, t.state, t.requester, t.details, t.feedback or "",
            timezone.localtime(t.cree_le).strftime("%d/%m/%Y %H:%M") if t.cree_le else "",
            timezone.localtime(t.modifie_le).strftime("%d/%m/%Y %H:%M") if t.modifie_le else "",
        ])

    response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{nom_base}.xlsx"'
    wb.save(response)
    return response


@csrf_exempt
def ticket_detail(request, ticket_pk):
    """Modifier/supprimer un ticket précis via sa clé primaire Django."""
    if request.method in ('DELETE', 'PUT'):
        if not request.user.is_authenticated or not request.user.a_la_permission(Permission.Code.GERER_TICKETS):
            return JsonResponse({"erreur": "Accès interdit"}, status=403)

        try:
            ticket = Ticket.objects.get(pk=ticket_pk)
        except Ticket.DoesNotExist:
            return JsonResponse({"erreur": "Ticket introuvable"}, status=404)

        if request.method == 'DELETE':
            ticket.delete()
            return JsonResponse({"message": "Ticket supprimé"})

        if request.method == 'PUT':
            data = json.loads(request.body)
            for champ in ('ticket_id', 'state', 'requester', 'details', 'feedback'):
                if champ in data:
                    setattr(ticket, champ, data[champ])
            ticket.save()
            return JsonResponse({"message": "Ticket modifié"})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)

@csrf_exempt
def supprimer_lot(request, lot_id):
    if request.method != 'DELETE':
        return JsonResponse({"erreur": "Méthode non autorisée"}, status=405)

    if not request.user.is_authenticated or not request.user.a_la_permission(Permission.Code.GERER_TICKETS):
        return JsonResponse({"erreur": "Accès interdit"}, status=403)

    try:
        lot = ImportLot.objects.get(id=lot_id)
    except ImportLot.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    lot.delete()
    return JsonResponse({"message": "Import supprimé"})

@login_required
def tickets_du_lot(request, lot_id):
    q = request.GET.get('q', '').strip()
    state = request.GET.get('state', '').strip()
    date_debut = request.GET.get('date_debut', '').strip()
    date_fin = request.GET.get('date_fin', '').strip()

    try:
        lot = ImportLot.objects.get(id=lot_id)
    except ImportLot.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    qs = lot.tickets.all()

    if q:
        qs = qs.filter(
            Q(ticket_id__icontains=q) | Q(state__icontains=q) |
            Q(requester__icontains=q) | Q(details__icontains=q) | Q(feedback__icontains=q)
        )

    if state:
        qs = qs.filter(state=state)

    if date_debut:
        qs = qs.filter(modifie_le__date__gte=date_debut)

    if date_fin:
        qs = qs.filter(modifie_le__date__lte=date_fin)

    tickets = []
    for t in qs:
        tickets.append({
            "id": t.id, "ticket_id": t.ticket_id, "state": t.state, "requester": t.requester,
            "details": t.details, "feedback": t.feedback,
            "modifie_le": timezone.localtime(t.modifie_le).strftime("%d/%m/%Y %H:%M"),
        })

    # Liste des states distincts présents dans ce lot, pour peupler le filtre dropdown
    states_disponibles = list(lot.tickets.values_list('state', flat=True).distinct())

    return JsonResponse({"titre": lot.titre, "tickets": tickets, "states_disponibles": states_disponibles})