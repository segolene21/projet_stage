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
    dernier_ticket = None
    for row in ws.iter_rows(min_row=2, values_only=True):
        ticket_id, state, requester, details = row[:4]

        if not ticket_id:
            if dernier_ticket and details:
                dernier_ticket.details = (dernier_ticket.details + "\n" + str(details)).strip()
                dernier_ticket.save(update_fields=["details"])
            continue

        ticket_id_str = str(ticket_id)
        dernier_ticket = Ticket.objects.create(
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

    donnees = [["ID", "State", "Requester", "Details", "Feedback", "Modifié le"]]

    for t in tickets:
        donnees.append([
            Paragraph(t.ticket_id or "", style_cellule),
            t.state,
            Paragraph(t.requester or "", style_cellule),
            Paragraph(t.details or "", style_cellule),
            Paragraph(t.feedback or "", style_cellule),
            timezone.localtime(t.modifie_le).strftime("%d/%m/%Y %H:%M") if t.modifie_le else "",
        ])

    largeurs = [2.5*cm, 2.5*cm, 4*cm, 8*cm, 6*cm, 3*cm]

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
    tickets = lot.tickets.all()
    format = request.GET.get('format', 'xlsx')  # <-- on lit le format demandé

    # --- Branche PDF ---
    if format == 'pdf':
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="tickets_{lot.id}.pdf"'
        _generer_pdf(tickets, response)
        return response


    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Tickets"
    ...

    header_font = Font(bold=True, color="FFCC00", size=11)
    header_fill = PatternFill("solid", fgColor="1A1A1A")
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True) # <- wrap_text=True
    border = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )

    # En-têtes
    entetes = ['ID Ticket', 'State', 'Requester', 'Details', 'Feedback', 'Modifié le']
    for col, entete in enumerate(entetes, 1):
        cell = ws.cell(row=1, column=col, value=entete)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = border
    ws.row_dimensions[1].height = 25 # Hauteur entete

    fill_pair = [
        PatternFill("solid", fgColor="FFFFFF"), # Blanc
        PatternFill("solid", fgColor="FFF8D6"), # Beige clair
    ]
    data_align = Alignment(vertical="top", wrap_text=True) # <- wrap_text=True + top

    # Données
    tickets = lot.tickets.all()
    for row, ticket in enumerate(tickets, 2):
        valeurs = [
            ticket.ticket_id,
            ticket.state,
            ticket.requester,
            ticket.details, 
            ticket.feedback,
            timezone.localtime(ticket.modifie_le).strftime('%d/%m/%Y %H:%M') if ticket.modifie_le else '',
        ]
        for col, val in enumerate(valeurs, 1):
            cell = ws.cell(row=row, column=col, value=val)
            cell.fill = fill_pair[row % 2]
            cell.alignment = data_align
            cell.border = border

    # LARGEUR COLONNES FIXE comme le tableau bleu - plus de auto
    ws.column_dimensions['A'].width = 18 # ID Ticket
    ws.column_dimensions['B'].width = 16 # State
    ws.column_dimensions['C'].width = 22 # Requester
    ws.column_dimensions['D'].width = 55 # Details <- LARGE
    ws.column_dimensions['E'].width = 40 # Feedback
    ws.column_dimensions['F'].width = 20 # Modifié le

    # HAUTEUR LIGNE AUTO pour les \n
    for r in range(2, ws.max_row + 1):
        ws.row_dimensions[r].height = None # None = auto

    # Figer la première ligne
    ws.freeze_panes = "A2"

    # Réponse HTTP
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
          for champ in ('ticket_id', 'state', 'requester', 'details', 'feedback', 'modifie_le'):
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

    qs = lot.tickets.all().order_by('id')

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

    return JsonResponse({"titre": lot.titre, "tickets": tickets})


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
    try:
        parsed = dt_module.datetime.strptime(str(valeur).strip(), "%d/%m/%Y %H:%M")
        return timezone.make_aware(parsed)
    except ValueError:
        return None


def _parser_duree(valeur):
    """Excel renvoie souvent les durées comme un objet time ou timedelta."""
    if not valeur:
        return None
    if isinstance(valeur, dt_module.timedelta):
        return valeur
    if isinstance(valeur, dt_module.time):
        return dt_module.timedelta(hours=valeur.hour, minutes=valeur.minute, seconds=valeur.second)
    try:
        h, m, s = str(valeur).strip().split(':')
        return dt_module.timedelta(hours=int(h), minutes=int(m), seconds=int(s))
    except (ValueError, AttributeError):
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
        valeurs = list(row) + [None] * 12
        (incident_id, description, reported, severite, _rca_vide, _colonne_vide, impact,
         affected_service, root_cause, action_resolution, duration, rca_statut) = valeurs[:12]

        if not incident_id:
            continue

        Incident.objects.create(
            import_lot=lot,
            incident_id=str(incident_id),
            description=description or "",
            date_signalement=_parser_date(reported),
            severite=str(severite) if severite else "",
            impact=impact or "",
            affected_service=affected_service or "",
            root_cause=root_cause or "",
            action_resolution=action_resolution or "",
            duree=_parser_duree(duration),
            statut_rca=_parser_statut_rca(rca_statut),
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
            "duree": str(i.duree) if i.duree else "",
            "statut_rca": i.statut_rca,
            "owner_email": i.owner_email or "",
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
            str(i.duree) if i.duree else "",
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
    format_export = request.GET.get('format', 'xlsx')

    try:
        lot = ImportIncidents.objects.get(id=lot_id)
    except ImportIncidents.DoesNotExist:
        return JsonResponse({"erreur": "Import introuvable"}, status=404)

    incidents = lot.incidents.all().order_by('id')
    nom_base = lot.titre.replace(" ", "_")

    if format_export == 'pdf':
        response = HttpResponse(content_type='application/pdf')
        response["Content-Disposition"] = f'attachment; filename="{nom_base}.pdf"'
        _generer_pdf_incidents(incidents, response)
        return response

    wb = Workbook()
    ws = wb.active
    ws.title = "Incidents"

    entetes = ["ID", "Description", "Reported Date", "Severity", "Impact", "Affected Service",
               "Root Cause", "Action for Resolution", "Duration", "RCA Status", "Owner Email", "RCA attaché"]
    ws.append(entetes)

    for i in incidents:
        ws.append([
            i.incident_id, i.description,
            timezone.localtime(i.date_signalement).strftime("%d/%m/%Y %H:%M") if i.date_signalement else "",
            i.severite, i.impact, i.affected_service, i.root_cause, i.action_resolution,
            str(i.duree) if i.duree else "", i.get_statut_rca_display(), i.owner_email or "",
            "Oui" if i.rca_present else "Non",
        ])

    # ---------- STYLE ----------

    couleur_entete_fond = "000000"    # noir
    couleur_entete_texte = "FFC000"   # orange
    couleur_ligne_alt = "FFF2CC"      # jaune pâle
    police_nom = "Arial"

    font_entete = Font(name=police_nom, bold=True, color=couleur_entete_texte, size=11)
    fill_entete = PatternFill(start_color=couleur_entete_fond, end_color=couleur_entete_fond, fill_type="solid")
    fill_alt = PatternFill(start_color=couleur_ligne_alt, end_color=couleur_ligne_alt, fill_type="solid")

    bordure_fine = Side(style="thin", color="B7B7B7")
    bordure = Border(left=bordure_fine, right=bordure_fine, top=bordure_fine, bottom=bordure_fine)

    nb_colonnes = len(entetes)
    nb_lignes = ws.max_row

    # Ligne d'en-tête
    for col in range(1, nb_colonnes + 1):
        cellule = ws.cell(row=1, column=col)
        cellule.font = font_entete
        cellule.fill = fill_entete
        cellule.border = bordure
        cellule.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws.row_dimensions[1].height = 28

    # Lignes de données : bordures + alignement + alternance de couleur (1 ligne sur 2)
    for row in range(2, nb_lignes + 1):
        est_alt = (row % 2 == 0)
        for col in range(1, nb_colonnes + 1):
            cellule = ws.cell(row=row, column=col)
            cellule.font = Font(name=police_nom, size=10)
            cellule.border = bordure
            cellule.alignment = Alignment(wrap_text=True, vertical="top")
            if est_alt:
                cellule.fill = fill_alt

    # Largeurs de colonnes adaptées au contenu
    largeurs_colonnes = {
        'A': 18, 'B': 40, 'C': 18, 'D': 10, 'E': 30, 'F': 30,
        'G': 35, 'H': 35, 'I': 12, 'J': 14, 'K': 25, 'L': 12,
    }
    for lettre, largeur in largeurs_colonnes.items():
        ws.column_dimensions[lettre].width = largeur

    # Ligne d'en-tête figée
    ws.freeze_panes = "A2"

    response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{nom_base}.xlsx"'
    wb.save(response)
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
            for champ in ('incident_id', 'description', 'severite', 'impact', 'owner_email', 'statut'):
                if champ in data:
                    setattr(incident, champ, data[champ])
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
