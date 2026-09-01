from itertools import count

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.contrib import messages
from openpyxl import load_workbook, Workbook


import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import ImportLot
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
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
@permission_requise(Permission.Code.CONSULTER_OUTILS, is_json=False)
def liste_outils(request):
    requete = request.GET.get('q', '')
    team_id = request.GET.get('team', '')
    authentification = request.GET.get('authentification', '')
    statut = request.GET.get('statut', '')

    outils = OutilMonitoring.objects.all()

    if requete:
        outils = outils.filter(nom__icontains=requete)

    if team_id:
        outils = outils.filter(outil_team_id=team_id)

    if authentification == 'oui':
        outils = outils.filter(necessite_authentification=True)
    elif authentification == 'non':
        outils = outils.filter(necessite_authentification=False)

    if statut == 'actif':
        outils = outils.filter(statut=True)
    elif statut == 'inactif':
        outils = outils.filter(statut=False)

    outils_teams = OutilTeam.objects.all()
    outils = outils.distinct().order_by('id')
    return render(request, 'liste_outils.html', {
        'outils': outils,
        'outils_teams': outils_teams,
        'requete': requete,
        'team_id_selectionne': team_id,
        'authentification_selectionnee': authentification,
        'statut_selectionne': statut,
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
    services = services.distinct().order_by('id')

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
    requete = request.GET.get('q', '')
    equipe_id = request.GET.get('equipe', '')

    mots_cles = MotsClesAssignation.objects.all()

    if requete:
        mots_cles = mots_cles.filter(intitule__icontains=requete)

    if equipe_id:
        mots_cles = mots_cles.filter(equipe_id=equipe_id)

    equipes = Equipe.objects.all()
    membres = Utilisateurs.objects.filter(role__nom=Role.Nom.MEMBRE_TECHCOMMAND)

    mots_cles = mots_cles.order_by('id')       
    return render(request, 'liste_mots_cles.html', {
        'mots_cles': mots_cles,
        'equipes': equipes,
        'membres': membres,
        'requete': requete,
        'equipe_id_selectionne': equipe_id,
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

@login_required
@permission_requise(Permission.Code.GERER_UTILISATEURS, is_json=False)
def liste_utilisateurs(request):
    requete = request.GET.get('q', '')
    statut = request.GET.get('statut', '')

    base_qs = Utilisateurs.objects.all()

    if requete:
        base_qs = base_qs.filter(
            Q(username__icontains=requete) |
            Q(first_name__icontains=requete) |
            Q(last_name__icontains=requete) |
            Q(email__icontains=requete)
        )

    if statut == 'actif':
        base_qs = base_qs.filter(is_active=True)
    elif statut == 'inactif':
        base_qs = base_qs.filter(is_active=False)

    roles = Role.objects.all()
    utilisateurs_par_role = {
        role: base_qs.filter(role=role) for role in roles
    }

    return render(request, 'liste-utilisateurs.html', {
        'utilisateurs_par_role': utilisateurs_par_role,
        'roles': roles,
        'requete': requete,
        'statut_selectionne': statut,
    })
@permission_requise(Permission.Code.GERER_UTILISATEURS)
def ajouter_utilisateur(request):
    if request.method == 'POST':
        form = ProfilForm(request.POST)
        role_id = request.POST.get('role_id')
        role = get_object_or_404(Role, id=role_id) if role_id else None
        password = request.POST.get('password1')
        password_confirm = request.POST.get('password2')

        if password != password_confirm:
            return JsonResponse({'succes': False, 'erreurs': {'password2': ['Les mots de passe ne correspondent pas']}}, status=400)

        if form.is_valid():
            utilisateur = form.save(commit=False)
            utilisateur.role = role
            utilisateur.set_password(password)
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
        valeurs = list(row) + [None] * 12
        (number, _short_desc, description, _priority, _created, created_by,
         _assignment_group, assigned_to, state, _updated, _updated_by, _comments) = valeurs[:12]

        if not number:
            continue

        ticket_id_str = str(number)
        Ticket.objects.create(
            import_lot=lot,
            ticket_id=ticket_id_str,
            state=state or "",
            requester=created_by or "",
            assigned_to=assigned_to or "",
            details=description or "",
            feedback=feedbacks.get(ticket_id_str, ""),
        )
        count += 1

    return JsonResponse({"message": f"{count} tickets importés", "lot_id": lot.id, "titre": lot.titre})

@login_required
def liste_imports(request):
    periode_type = request.GET.get('periode_type', '')  # 'semaine', 'mois', 'annee', ou vide
    annee = request.GET.get('annee', '')
    mois = request.GET.get('mois', '')
    semaine = request.GET.get('semaine', '')

    lots = ImportLot.objects.all()

    if periode_type == 'annee' and annee:
        lots = lots.filter(cree_le__year=annee)
    elif periode_type == 'mois' and annee and mois:
        lots = lots.filter(cree_le__year=annee, cree_le__month=mois)
    elif periode_type == 'semaine' and annee and semaine:
        lots = lots.filter(cree_le__iso_year=annee, cree_le__week=semaine)

    lots = lots.order_by('-cree_le')

    resultat = []
    for lot in lots:
        tickets = lot.tickets.all()[:5]
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

def _generer_pdf(tickets, response):
    styles = getSampleStyleSheet()
    style_cellule = styles["Normal"]
    style_cellule.fontSize = 7
    style_cellule.leading = 8

    doc = SimpleDocTemplate(
        response, pagesize=landscape(A4),
        leftMargin=1*cm, rightMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm
    )

    donnees = [["ID", "State", "Requester", "Assigned to", "Details", "Feedback", "Modifié le"]]

    for t in tickets:
        donnees.append([
            Paragraph(t.ticket_id or "", style_cellule),
            t.state,
            Paragraph(t.requester or "", style_cellule),
            Paragraph(t.assigned_to or "", style_cellule),
            Paragraph(t.details or "", style_cellule),
            Paragraph(t.feedback or "", style_cellule),
            timezone.localtime(t.modifie_le).strftime("%d/%m/%Y %H:%M") if t.modifie_le else "",
        ])

    largeurs = [2.3*cm, 2.3*cm, 3*cm, 3*cm, 7*cm, 5.5*cm, 2.6*cm]

    tableau = Table(donnees, colWidths=largeurs, repeatRows=1)
    tableau.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#FFCC00")),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    doc.build([tableau])


import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import ImportLot
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle


@login_required
def exporter_lot_excel(request, lot_id):
    lot = get_object_or_404(ImportLot, id=lot_id)
    tickets = lot.tickets.all().order_by('id')
    format = request.GET.get('format', 'xlsx')

    if format == 'pdf':
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="tickets_{lot.id}.pdf"'
        _generer_pdf(tickets, response)
        return response

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Tickets"

    header_font = Font(bold=True, color="FFCC00", size=11)
    header_fill = PatternFill("solid", fgColor="1A1A1A")
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    border = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )

    entetes = ['ID Ticket', 'State', 'Requester', 'Assigned to', 'Details', 'Feedback', 'Modifié le']
    for col, entete in enumerate(entetes, 1):
        cell = ws.cell(row=1, column=col, value=entete)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = border
    ws.row_dimensions[1].height = 25

    fill_pair = [
        PatternFill("solid", fgColor="FFFFFF"),
        PatternFill("solid", fgColor="FFF8D6"),
    ]
    data_align = Alignment(vertical="top", wrap_text=True)

    for row, ticket in enumerate(tickets, 2):
        valeurs = [
            ticket.ticket_id,
            ticket.state,
            ticket.requester,
            ticket.assigned_to,
            ticket.details,
            ticket.feedback,
            timezone.localtime(ticket.modifie_le).strftime('%d/%m/%Y %H:%M') if ticket.modifie_le else '',
        ]
        for col, val in enumerate(valeurs, 1):
            cell = ws.cell(row=row, column=col, value=val)
            cell.fill = fill_pair[row % 2]
            cell.alignment = data_align
            cell.border = border

    ws.column_dimensions['A'].width = 18  # ID Ticket
    ws.column_dimensions['B'].width = 16  # State
    ws.column_dimensions['C'].width = 22  # Requester
    ws.column_dimensions['D'].width = 22  # Assigned to
    ws.column_dimensions['E'].width = 50  # Details
    ws.column_dimensions['F'].width = 35  # Feedback
    ws.column_dimensions['G'].width = 20  # Modifié le

    for r in range(2, ws.max_row + 1):
        ws.row_dimensions[r].height = None

    ws.freeze_panes = "A2"

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="tickets_{lot.id}.xlsx"'
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
          for champ in ('ticket_id', 'state', 'requester', 'assigned_to', 'details', 'feedback', 'modifie_le'):
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
    assigne_a = request.GET.get('assigned_to', '').strip()

    try:
        lot = ImportLot.objects.get(id=lot_id)
    except ImportLot.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    qs = lot.tickets.all().order_by('id')

    if q:
        qs = qs.filter(
            Q(ticket_id__icontains=q) | Q(state__icontains=q) |
            Q(requester__icontains=q) | Q(details__icontains=q) |
            Q(feedback__icontains=q) | Q(assigned_to__icontains=q)
        )

    if assigne_a:
        qs = qs.filter(assigned_to=assigne_a)

    tickets = []
    for t in qs:
        tickets.append({
            "id": t.id, "ticket_id": t.ticket_id, "state": t.state, "requester": t.requester,
            "assigned_to": t.assigned_to, "details": t.details, "feedback": t.feedback,
            "modifie_le": timezone.localtime(t.modifie_le).strftime("%d/%m/%Y %H:%M"),
        })

    # Décompte par personne assignée (pour peupler le filtre + afficher les chiffres)
    from django.db.models import Count
    repartition = list(
        lot.tickets.exclude(assigned_to='').values('assigned_to')
        .annotate(total=Count('id')).order_by('-total')
    )

    return JsonResponse({"titre": lot.titre, "tickets": tickets, "repartition": repartition})



import json
from datetime import datetime
from openpyxl import load_workbook, Workbook
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.utils import timezone
from django.db.models import Q

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

from .models import Incident, ImportIncidents, Permission


@login_required
def page_incidents(request):
    return render(request, 'liste_incidents.html')


import datetime as dt_module

def _parser_date(valeur):
    if not valeur:
        return None
    if isinstance(valeur, dt_module.datetime):
        return timezone.make_aware(valeur) if timezone.is_naive(valeur) else valeur
    texte = str(valeur).strip()
    for fmt in ("%d/%m/%Y %H:%M", "%Y-%m-%dT%H:%M"):
        try:
            parsed = dt_module.datetime.strptime(texte, fmt)
            return timezone.make_aware(parsed)
        except ValueError:
            continue
    return None


def _parser_statut_rca(valeur):
    if not valeur:
        return ''
    v = str(valeur).strip().upper()
    if 'NOT' in v:
        return Incident.StatutRCA.NOT_PROVIDED
    if 'PROVIDED' in v:
        return Incident.StatutRCA.PROVIDED
    return ''


@csrf_exempt
def import_incidents_excel(request):
    if not request.user.is_authenticated or not request.user.a_la_permission(Permission.Code.GERER_INCIDENTS):
        return JsonResponse({"erreur": "Accès interdit"}, status=403)

    if request.method != "POST":
        return JsonResponse({"erreur": "Méthode non autorisée"}, status=405)

    fichier = request.FILES.get("fichier")
    if not fichier:
        return JsonResponse({"erreur": "Aucun fichier reçu"}, status=400)

    titre = request.POST.get("titre", "").strip() or f"Import du {timezone.localtime().strftime('%d/%m/%Y %H:%M')}"

    wb = load_workbook(fichier, data_only=True)
    ws = wb.active

    lot = ImportIncidents.objects.create(titre=titre, cree_par=request.user)

    count = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        valeurs = list(row) + [None] * 16
        (number, description, _short_desc, _caller, state, assignment_group, assigned_to,
         _org_unit, priority, opened, _fixed_by, _caused_by, _rca_text,
         resolution_notes, resolution_time, resolved) = valeurs[:16]

        if not number:
            continue

        Incident.objects.create(
    import_lot=lot,
    incident_id=str(number),
    description=description or "",
    date_signalement=_parser_date(opened),
    severite=str(priority) if priority else "",
    action_resolution=resolution_notes or "",
    duree_secondes=int(resolution_time) if resolution_time else None,
    in_charge=assigned_to or "",
    service_now_status=state or "",
    close_date=_parser_date(resolved),
    statut_rca=Incident.StatutRCA.NOT_PROVIDED,
)
        count += 1

    return JsonResponse({"message": f"{count} incidents importés", "lot_id": lot.id, "titre": lot.titre})
 


@login_required
def liste_imports_incidents(request):
    periode_type = request.GET.get('periode_type', '')
    annee = request.GET.get('annee', '')
    mois = request.GET.get('mois', '')
    semaine = request.GET.get('semaine', '')

    lots = ImportIncidents.objects.all()

    if periode_type == 'annee' and annee:
        lots = lots.filter(cree_le__year=annee)
    elif periode_type == 'mois' and annee and mois:
        lots = lots.filter(cree_le__year=annee, cree_le__month=mois)
    elif periode_type == 'semaine' and annee and semaine:
        lots = lots.filter(cree_le__iso_year=annee, cree_le__week=semaine)

    lots = lots.order_by('-cree_le')

    resultat = []
    for lot in lots:
        incidents = lot.incidents.all().order_by('id')[:5]
        resultat.append({
            "id": lot.id,
            "titre": lot.titre,
            "cree_le": timezone.localtime(lot.cree_le).strftime("%d/%m/%Y %H:%M"),
            "nombre_incidents": lot.incidents.count(),
            "apercu": [
                {
                    "incident_id": i.incident_id, "description": i.description,
                    "severite": i.severite, "owner_email": i.owner_email or "",
                    "rca_present": i.rca_present,
                } for i in incidents
            ],
        })

    return JsonResponse(resultat, safe=False)


@login_required
def incidents_du_lot(request, lot_id):
    q = request.GET.get('q', '').strip()
    rca_statut = request.GET.get('rca', '').strip()

    try:
        lot = ImportIncidents.objects.get(id=lot_id)
    except ImportIncidents.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    qs = lot.incidents.all().order_by('id')

    if q:
        qs = qs.filter(
            Q(incident_id__icontains=q) | Q(description__icontains=q) |
            Q(severite__icontains=q) | Q(impact__icontains=q) | Q(owner_email__icontains=q) |
            Q(affected_service__icontains=q) | Q(root_cause__icontains=q) | Q(action_resolution__icontains=q)
        )

    if rca_statut == 'avec':
        qs = qs.exclude(rca_fichier='')
    elif rca_statut == 'sans':
        qs = qs.filter(Q(rca_fichier='') | Q(rca_fichier__isnull=True))

    incidents = []
    for i in qs:
        incidents.append({
            "id": i.id,
            "incident_id": i.incident_id,
            "description": i.description,
            "date_signalement": timezone.localtime(i.date_signalement).strftime("%d/%m/%Y %H:%M") if i.date_signalement else "",
            "severite": i.severite,
            "impact": i.impact,
            "affected_service": i.affected_service,
            "root_cause": i.root_cause,
            "action_resolution": i.action_resolution,
            "duree": str(i.duree_secondes) if i.duree_secondes else "",
            "statut_rca": i.statut_rca,
            "owner_email": i.owner_email or "",
            "cc_emails": i.cc_emails or "",
            "rca_present": i.rca_present,
            "rca_url": i.rca_fichier.url if i.rca_fichier else "",
            "modifie_le": timezone.localtime(i.modifie_le).strftime("%d/%m/%Y %H:%M"),
        })

    total = lot.incidents.count()
    sans_rca = lot.incidents.filter(Q(rca_fichier='') | Q(rca_fichier__isnull=True)).count()

    return JsonResponse({"titre": lot.titre, "incidents": incidents, "total": total, "sans_rca": sans_rca})

from reportlab.lib.units import cm

def _generer_pdf_incidents(incidents, response):
    styles = getSampleStyleSheet()
    style_cellule = styles["Normal"]
    style_cellule.fontSize = 6
    style_cellule.leading = 7

    doc = SimpleDocTemplate(
        response, pagesize=landscape(A4),
        leftMargin=1*cm, rightMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm
    )

    donnees = [["ID", "Description", "Reported", "Sev.", "Impact", "Affected Service",
                "Root Cause", "Action", "Duration", "RCA Status", "Owner", "RCA"]]

    for i in incidents:
        donnees.append([
            Paragraph(i.incident_id or "", style_cellule),
            Paragraph(i.description or "", style_cellule),
            timezone.localtime(i.date_signalement).strftime("%d/%m/%y %H:%M") if i.date_signalement else "",
            i.severite,
            Paragraph(i.impact or "", style_cellule),
            Paragraph(i.affected_service or "", style_cellule),
            Paragraph(i.root_cause or "", style_cellule),
            Paragraph(i.action_resolution or "", style_cellule),
            str(i.duree_secondes) if i.duree_secondes else "",
            i.get_statut_rca_display(),
            Paragraph(i.owner_email or "", style_cellule),
            "Oui" if i.rca_present else "Non",
        ])

    # Largeur totale disponible ≈ 25.7 cm (A4 paysage moins marges de 1cm x2)
    largeurs = [1.8*cm, 2.9*cm, 2.4*cm, 1.2*cm, 2.8*cm, 3.0*cm, 3.0*cm, 2.7*cm, 1.5*cm, 1.8*cm, 2.6*cm, 1.0*cm]
   
    tableau = Table(donnees, colWidths=largeurs, repeatRows=1)
    tableau.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#FFCC00")),
    ('FONTSIZE', (0, 0), (-1, -1), 6),
    ('FONTSIZE', (0, 0), (-1, 0), 7),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
    doc.build([tableau])



from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side


@login_required
def export_lot_incidents(request, lot_id):
    type_rapport = request.GET.get('type', 'court')

    try:
        lot = ImportIncidents.objects.get(id=lot_id)
    except ImportIncidents.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    incidents = lot.incidents.all().order_by('id')
    nom_base = f"{lot.titre.replace(' ', '_')}_rapport_{type_rapport}"

    if type_rapport == 'pdf':
        response = HttpResponse(content_type='application/pdf')
        response["Content-Disposition"] = f'attachment; filename="{nom_base}.pdf"'
        _generer_pdf_incidents(incidents, response)
        return response

    response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{nom_base}.xlsx"'

    if type_rapport == 'long':
      _export_incidents_long(incidents, response)
    else:
        _export_incidents_court(incidents, response)

    return response

   

@csrf_exempt
def supprimer_lot_incidents(request, lot_id):
    if request.method != 'DELETE':
        return JsonResponse({"erreur": "Méthode non autorisée"}, status=405)
    if not request.user.is_authenticated or not request.user.a_la_permission(Permission.Code.GERER_INCIDENTS):
        return JsonResponse({"erreur": "Accès interdit"}, status=403)

    try:
        lot = ImportIncidents.objects.get(id=lot_id)
    except ImportIncidents.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    lot.delete()
    return JsonResponse({"message": "Import supprimé"})


@csrf_exempt
def incident_detail(request, incident_pk):
    if request.method in ('DELETE', 'PUT'):
        if not request.user.is_authenticated or not request.user.a_la_permission(Permission.Code.GERER_INCIDENTS):
            return JsonResponse({"erreur": "Accès interdit"}, status=403)

        try:
            incident = Incident.objects.get(pk=incident_pk)
        except Incident.DoesNotExist:
            return JsonResponse({"erreur": "Incident introuvable"}, status=404)

        if request.method == 'DELETE':
            incident.delete()
            return JsonResponse({"message": "Incident supprimé"})

        if request.method == 'PUT':
            data = json.loads(request.body)

            champs_texte = ('incident_id', 'description', 'severite', 'impact', 'affected_service',
                             'root_cause', 'action_resolution', 'statut_rca', 'owner_email',
                             'team', 'in_charge', 'service_now_status', 'cc_emails')
            for champ in champs_texte:
                if champ in data:
                    setattr(incident, champ, data[champ])

            if 'date_signalement' in data:
                incident.date_signalement = _parser_date(data['date_signalement']) if data['date_signalement'] else None

            if 'close_date' in data:
                incident.close_date = _parser_date(data['close_date']) if data['close_date'] else None

            if 'duree_secondes' in data:
                try:
                    incident.duree_secondes = int(data['duree_secondes']) if data['duree_secondes'] else None
                except (ValueError, TypeError):
                    pass

            incident.save()
            return JsonResponse({"message": "Incident modifié"})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@csrf_exempt
def uploader_rca(request, incident_pk):
    if not request.user.is_authenticated or not request.user.a_la_permission(Permission.Code.GERER_INCIDENTS):
        return JsonResponse({"erreur": "Accès interdit"}, status=403)

    if request.method != 'POST':
        return JsonResponse({"erreur": "Méthode non autorisée"}, status=405)

    try:
        incident = Incident.objects.get(pk=incident_pk)
    except Incident.DoesNotExist:
        return JsonResponse({"erreur": "Incident introuvable"}, status=404)

    fichier = request.FILES.get('rca')
    if not fichier:
        return JsonResponse({"erreur": "Aucun fichier reçu"}, status=400)

    if not fichier.name.lower().endswith('.pdf'):
        return JsonResponse({"erreur": "Le RCA doit être un fichier PDF"}, status=400)
    incident.rca_fichier = fichier
    incident.statut_rca = Incident.StatutRCA.PROVIDED
    incident.save()

    return JsonResponse({"message": "RCA attaché avec succès", "rca_url": incident.rca_fichier.url})



@csrf_exempt
@login_required
def changer_theme(request):
    if request.method != "POST":
        return JsonResponse({"erreur": "Méthode non autorisée"}, status=405)

    data = json.loads(request.body)
    theme_sombre = bool(data.get("theme_sombre"))

    request.user.theme_sombre = theme_sombre
    request.user.save(update_fields=["theme_sombre"])

    return JsonResponse({"succes": True})


import re

CARACTERES_INVALIDES_XML = re.compile('[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')

def nettoyer_texte_excel(valeur):
    if valeur is None:
        return ""
    texte = str(valeur)
    return CARACTERES_INVALIDES_XML.sub('', texte)
@login_required
def export_lot_incidents(request, lot_id):
    type_rapport = request.GET.get('type', 'court')

    try:
        lot = ImportIncidents.objects.get(id=lot_id)
    except ImportIncidents.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    incidents = lot.incidents.all().order_by('id')
    nom_base = f"{lot.titre.replace(' ', '_')}_rapport_{type_rapport}"

    if type_rapport == 'pdf':
        response = HttpResponse(content_type='application/pdf')
        response["Content-Disposition"] = f'attachment; filename="{nom_base}.pdf"'
        _generer_pdf_incidents(incidents, response)
        return response

    response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{nom_base}.xlsx"'

    if type_rapport == 'long':
        _export_incidents_long(incidents, response)
    else:
        _export_incidents_court(incidents, response)

    return response


def _export_incidents_long(incidents, response):
    wb = Workbook()
    ws = wb.active
    ws.title = "Incidents"

    header_font = Font(bold=True, color="FFCC00", size=11)
    header_fill = PatternFill("solid", fgColor="1A1A1A")
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    border = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )

    entetes = ["Month", "ID", "Issue Description", "Reported Date", "Severity", "SIGNED RCA STATUS",
               "Impacted", "Affected Service", "root cause", "Action for Resolution", "Duration",
               "TEAM", "In charge", "STATUS", "close date", "RCA"]
    for col, entete in enumerate(entetes, 1):
        cell = ws.cell(row=1, column=col, value=entete)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = border
    ws.row_dimensions[1].height = 25

    fill_pair = [
        PatternFill("solid", fgColor="FFFFFF"),
        PatternFill("solid", fgColor="FFF8D6"),
    ]
    data_align = Alignment(vertical="top", wrap_text=True)

    for row, i in enumerate(incidents, 2):
        valeurs = [
            nettoyer_texte_excel(i.month),
            nettoyer_texte_excel(i.incident_id),
            nettoyer_texte_excel(i.description),
            timezone.localtime(i.date_signalement).strftime("%m/%d/%Y %I:%M %p") if i.date_signalement else "",
            nettoyer_texte_excel(i.severite),
            i.get_statut_rca_display() if i.statut_rca else "",
            nettoyer_texte_excel(i.impact),
            nettoyer_texte_excel(i.affected_service),
            nettoyer_texte_excel(i.root_cause),
            nettoyer_texte_excel(i.action_resolution),
            i.duree_secondes if i.duree_secondes is not None else "",
            nettoyer_texte_excel(i.team),
            nettoyer_texte_excel(i.in_charge),
            nettoyer_texte_excel(i.service_now_status),
            timezone.localtime(i.close_date).strftime("%m/%d/%Y %I:%M %p") if i.close_date else "",
            "Oui" if i.rca_present else "Non",
        ]
        for col, val in enumerate(valeurs, 1):
            cell = ws.cell(row=row, column=col, value=val)
            cell.fill = fill_pair[row % 2]
            cell.alignment = data_align
            cell.border = border

    largeurs = {
        'A': 10, 'B': 15, 'C': 35, 'D': 18, 'E': 12, 'F': 16,
        'G': 22, 'H': 22, 'I': 22, 'J': 30, 'K': 12,
        'L': 20, 'M': 18, 'N': 15, 'O': 18, 'P': 10,
    }
    for lettre, largeur in largeurs.items():
        ws.column_dimensions[lettre].width = largeur

    for r in range(2, ws.max_row + 1):
        ws.row_dimensions[r].height = None

    ws.freeze_panes = "A2"

    wb.save(response)

def _export_incidents_court(incidents, response):
    wb = Workbook()
    ws = wb.active
    ws.title = "Incidents"

    header_font = Font(bold=True, color="FFCC00", size=11)
    header_fill = PatternFill("solid", fgColor="1A1A1A")
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    border = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )

    entetes = ["ID", "Issue Description", "Reported Date", "Severity", "Impact",
               "Affected Service", "root cause", "Action for Resolution", "Duration", "RCA"]
    for col, entete in enumerate(entetes, 1):
        cell = ws.cell(row=1, column=col, value=entete)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = border
    ws.row_dimensions[1].height = 25

    fill_pair = [
        PatternFill("solid", fgColor="FFFFFF"),
        PatternFill("solid", fgColor="FFF8D6"),
    ]
    data_align = Alignment(vertical="top", wrap_text=True)

    for row, i in enumerate(incidents, 2):
        valeurs = [
            nettoyer_texte_excel(i.incident_id),
            nettoyer_texte_excel(i.description),
            timezone.localtime(i.date_signalement).strftime("%m/%d/%Y %I:%M %p") if i.date_signalement else "",
            nettoyer_texte_excel(i.severite),
            nettoyer_texte_excel(i.impact),
            nettoyer_texte_excel(i.affected_service),
            nettoyer_texte_excel(i.root_cause),
            nettoyer_texte_excel(i.action_resolution),
            i.duree_secondes if i.duree_secondes is not None else "",
            i.get_statut_rca_display() if i.statut_rca else "",
        ]
        for col, val in enumerate(valeurs, 1):
            cell = ws.cell(row=row, column=col, value=val)
            cell.fill = fill_pair[row % 2]
            cell.alignment = data_align
            cell.border = border

    largeurs = {'A': 15, 'B': 40, 'C': 18, 'D': 12, 'E': 25, 'F': 25, 'G': 25, 'H': 35, 'I': 12, 'J': 14}
    for lettre, largeur in largeurs.items():
        ws.column_dimensions[lettre].width = largeur

    for r in range(2, ws.max_row + 1):
        ws.row_dimensions[r].height = None

    ws.freeze_panes = "A2"

    wb.save(response)


@login_required
def apercu_rapport_long(request, lot_id):
    try:
        lot = ImportIncidents.objects.get(id=lot_id)
    except ImportIncidents.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    incidents = lot.incidents.all().order_by('id')

    lignes = []
    for i in incidents:
        lignes.append({
            "id": i.id,
            "month": i.month,
            "incident_id": i.incident_id,
            "description": i.description,
            "date_signalement": timezone.localtime(i.date_signalement).strftime("%d/%m/%Y %H:%M") if i.date_signalement else "",
            "severite": i.severite,
            "statut_rca": i.statut_rca,
            "impact": i.impact,
            "affected_service": i.affected_service,
            "root_cause": i.root_cause,
            "action_resolution": i.action_resolution,
            "duree": i.duree_secondes if i.duree_secondes is not None else "",
            "team": i.team,
            "in_charge": i.in_charge,
            "service_now_status": i.service_now_status,
            "close_date": timezone.localtime(i.close_date).strftime("%d/%m/%Y %H:%M") if i.close_date else "",
            "rca": "Oui" if i.rca_present else "Non",
        })

    return JsonResponse({"titre": lot.titre, "lignes": lignes})

import re
from collections import Counter
from datetime import timedelta

from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Avg, Count, Q
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone

from .models import (
    Feedback,
    Incident,
    OutilMonitoring,
    Plainte,
    Recommandation,
    Service,
    Ticket,
)

PERIODES = {
    "semaine": 7,
    "mois": 30,
    "trimestre": 90,
}

MOTS_VIDES = {
    "le", "la", "les", "de", "des", "du", "un", "une", "et", "est", "en",
    "que", "qui", "pour", "dans", "sur", "avec", "pas", "plus", "ne",
    "se", "ce", "cette", "ces", "au", "aux", "il", "elle", "on", "nous",
    "vous", "ils", "à", "a", "été", "être", "avoir", "sont", "je",
}


def _borne_periode(periode):
    jours = PERIODES.get(periode, 30)
    return timezone.now() - timedelta(days=jours)


def sujets_recurrents(plaintes_qs, top_n=5):
    """Extraction simple des mots les plus fréquents dans le contenu
    des plaintes récentes (sans NLP avancé, sans lemmatisation)."""
    mots = []
    for plainte in plaintes_qs:
        tokens = re.findall(r"[a-zàâäéèêëïîôöùûüç]{4,}", plainte.contenu.lower())
        mots.extend(t for t in tokens if t not in MOTS_VIDES)
    compteur = Counter(mots)
    return [
        {"mot": mot, "occurrences": n}
        for mot, n in compteur.most_common(top_n)
        if n >= 2
    ]


def est_autorise_dashboard(user):
    """Ajuste ici la liste des rôles autorisés à voir le dashboard."""
    return user.is_manager or user.is_senior_manager or user.is_teamlead


@login_required
@user_passes_test(est_autorise_dashboard)
def dashboard_page(request):
    """Affiche la page du dashboard. Le contenu est vide côté serveur :
    le JS (côté binôme) va chercher les données via dashboard_data()
    et remplit les conteneurs."""
    return render(request, "manager_dashboard.html")


@login_required
@user_passes_test(est_autorise_dashboard)
def dashboard_data(request):
    """Retourne toutes les données du dashboard en JSON.
    Paramètre GET optionnel : periode = semaine | mois | trimestre (défaut: mois)"""
    periode = request.GET.get("periode", "mois")
    depuis = _borne_periode(periode)

    # ---------- TICKETS (état actuel, indépendant de la période) ----------
    tickets_ouverts_qs = Ticket.objects.exclude(state__icontains="closed")
    tickets_sans_feedback = tickets_ouverts_qs.filter(
        Q(feedback__isnull=True) | Q(feedback__exact="")
    ).count()
    seuil_anciennete = timezone.now() - timedelta(days=7)
    tickets_anciens = tickets_ouverts_qs.filter(modifie_le__lt=seuil_anciennete).count()

    # Activité sur la période sélectionnée : répartition par agent des tickets modifiés/créés récemment
    tickets_periode_qs = Ticket.objects.filter(modifie_le__gte=depuis)
    tickets_par_agent = (
    tickets_periode_qs.exclude(assigned_to__exact="")
    .values("assigned_to")
    .annotate(total=Count("id"))
    .order_by("-total")[:10]
)

    # ---------- INCIDENTS (état actuel, indépendant de la période) ----------
    incidents_actifs_qs = Incident.objects.exclude(service_now_status__iexact="closed")
    incidents_par_severite = (
        incidents_actifs_qs.values("severite")
        .exclude(severite__exact="")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    rca_en_attente = Incident.objects.filter(
        statut_rca=Incident.StatutRCA.NOT_PROVIDED
    ).order_by("date_signalement")
    duree_moyenne = incidents_actifs_qs.aggregate(moy=Avg("duree_secondes"))["moy"]

    # Tendance mensuelle : basée sur cree_le (date d'import), pas date_signalement (qui peut être ancienne)
    tendance_mensuelle = []
    for i in range(5, -1, -1):
        mois_debut = (timezone.now().replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        if i == 0:
            mois_fin = timezone.now()
        else:
            mois_suivant = mois_debut.replace(day=28) + timedelta(days=4)
            mois_fin = mois_suivant.replace(day=1)
        count = Incident.objects.filter(
            cree_le__gte=mois_debut, cree_le__lt=mois_fin
        ).count()
        tendance_mensuelle.append({"mois": mois_debut.strftime("%b %Y"), "total": count})

    # ---------- CATALOGUE (état actuel) ----------
    outils_qs = OutilMonitoring.objects.select_related("outil_team")
    outils_sans_owner = outils_qs.filter(
        Q(outil_team__isnull=True)
        | Q(outil_team__nom_point_de_contact__exact="")
        | Q(outil_team__nom_point_de_contact__isnull=True)
    ).count()
    services_non_couverts = Service.objects.filter(outils_monitoring__isnull=True).count()
    outils_par_equipe = (
        outils_qs.exclude(outil_team__isnull=True)
        .values("outil_team__nom")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    outils_avec_auth = outils_qs.filter(necessite_authentification=True).count()
    outils_sans_auth = outils_qs.filter(necessite_authentification=False).count()

    # ---------- EXPERIENCES MEMBRES (activité sur la période) ----------
    feedbacks_qs = Feedback.objects.filter(date_soumission__gte=depuis)
    plaintes_qs = Plainte.objects.filter(date_ajout__gte=depuis)
    recommandations_qs = Recommandation.objects.filter(date_soumission__gte=depuis)

    plaintes_anonymes = plaintes_qs.filter(anonyme=True).count()
    plaintes_nominatives = plaintes_qs.filter(anonyme=False).count()

    data = {
        "periode": periode,
        "kpis": {
           "tickets_sans_feedback": tickets_sans_feedback,
            "incidents_actifs": incidents_actifs_qs.count(),
            "rca_en_attente": rca_en_attente.count(),
            "duree_moyenne_resolution_secondes": duree_moyenne,
            "outils_sans_owner": outils_sans_owner,
            "services_non_couverts": services_non_couverts,
            "feedbacks_recents": feedbacks_qs.count()
            + plaintes_qs.count()
            + recommandations_qs.count(),
        },
        "tickets": {
            "par_agent": list(tickets_par_agent),
            "sans_feedback": tickets_sans_feedback,
            "anciens_plus_7j": tickets_anciens,
        },
        "incidents": {
            "par_severite": list(incidents_par_severite),
            "rca_en_attente": [
                {
                    "incident_id": inc.incident_id,
                    "severite": inc.severite,
                    "date_signalement": inc.date_signalement,
                    "team": inc.team,
                }
                for inc in rca_en_attente[:20]
            ],
            "tendance_mensuelle": tendance_mensuelle,
        },
        "catalogue": {
            "total_outils": outils_qs.count(),
            "total_services": Service.objects.count(),
            "outils_sans_owner": outils_sans_owner,
            "services_non_couverts": services_non_couverts,
            "par_equipe": list(outils_par_equipe),
            "avec_authentification": outils_avec_auth,
            "sans_authentification": outils_sans_auth,
        },
        "experiences": {
            "feedbacks": feedbacks_qs.count(),
            "plaintes": plaintes_qs.count(),
            "recommandations": recommandations_qs.count(),
            "plaintes_anonymes": plaintes_anonymes,
            "plaintes_nominatives": plaintes_nominatives,
            "sujets_recurrents": sujets_recurrents(plaintes_qs),
        },
    }

    return JsonResponse(data, json_dumps_params={"default": str, "ensure_ascii": False})