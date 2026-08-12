from django.shortcuts import render, get_object_or_404, redirect
from .models import OutilMonitoring, Service
from django.contrib.auth.decorators import login_required
from .forms import OutilMonitoringForm, ServiceForm, TeamLeadForm, MembreTechcommandForm, AdministrateurForm, OutilTeamForm,EquipeForm,ProfilForm,FeedbackForm, RecommandationForm, PlainteForm,MotsClesAssignationForm,TicketImportForm
from .models import Administrateur, TeamLead, MembreTechcommand,Utilisateurs, OutilTeam,Feedback, Recommandation, Plainte, Shift,MotsClesAssignation, Equipe, MembreTechcommand,Ticket
from django.http import HttpResponseForbidden, JsonResponse,HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
from django.contrib import messages
from openpyxl import load_workbook, Workbook


@login_required
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


@login_required
def liste_services(request):
    requete = request.GET.get('q', '')
    services = Service.objects.filter(nom__icontains=requete) if requete else Service.objects.all()
    tous_les_outils = OutilMonitoring.objects.all()
    return render(request, 'liste_services.html', {
        'services': services,
        'tous_les_outils': tous_les_outils,
        'requete': requete,
    })


@login_required
@csrf_exempt
def ajouter_outil(request):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    if request.method == 'POST':
        form = OutilMonitoringForm(request.POST)
        if form.is_valid():
            outil = form.save()
            return JsonResponse({'succes': True, 'id': outil.id, 'nom': outil.nom}, status=201)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def modifier_outil(request, outil_id):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    outil = get_object_or_404(OutilMonitoring, id=outil_id)

    if request.method == 'POST':
        form = OutilMonitoringForm(request.POST, instance=outil)
        if form.is_valid():
            outil = form.save()
            return JsonResponse({'succes': True, 'id': outil.id, 'nom': outil.nom}, status=200)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_outil(request, outil_id):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    outil = get_object_or_404(OutilMonitoring, id=outil_id)

    if request.method == 'POST':
        outil.delete()
        return JsonResponse({'succes': True}, status=200)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def detail_service(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    return render(request, 'detail_service.html', {'service': service})


@login_required
def ajouter_service(request):

    if request.method == "POST":

        form = ServiceForm(request.POST)

        if form.is_valid():

            service = form.save()

            return JsonResponse({
                "succes": True,
                "id": service.id,
                "nom": service.nom
            })

        return JsonResponse({
            "succes": False,
            "erreurs": form.errors
        })



@login_required
def modifier_service(request, service_id):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    service = get_object_or_404(Service, id=service_id)
    if request.method == 'POST':
        form = ServiceForm(request.POST, instance=service)
        if form.is_valid():
            service = form.save()
            return JsonResponse({'succes': True, 'id': service.id, 'nom': service.nom}, status=200)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_service(request, service_id):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    service = get_object_or_404(Service, id=service_id)
    if request.method == 'POST':
        service.delete()
        return JsonResponse({'succes': True}, status=200)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def liste_mots_cles(request):
    mots_cles = MotsClesAssignation.objects.all()
    equipes = Equipe.objects.all()
    membres = MembreTechcommand.objects.all()
    return render(request, 'liste_mots_cles.html', {
        'mots_cles': mots_cles,
        'equipes': equipes,
        'membres': membres,
    })


@login_required
def ajouter_mot_cle(request):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

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
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)



@login_required
def ajouter_equipe(request):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    if request.method == 'POST':
        form = EquipeForm(request.POST)
        if form.is_valid():
            equipe = form.save()
            return JsonResponse({'succes': True, 'id': equipe.id, 'nom': equipe.nom}, status=201)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def modifier_mot_cle(request, mot_cle_id):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

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
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_mot_cle(request, mot_cle_id):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    mot_cle = get_object_or_404(MotsClesAssignation, id=mot_cle_id)
    if request.method == 'POST':
        mot_cle.delete()
        return JsonResponse({'succes': True}, status=200)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def ajouter_utilisateur(request):
    if not hasattr(request.user, 'administrateur'):
        return JsonResponse({'erreur': 'Accès réservé aux Administrateurs'}, status=403)

    if request.method == 'POST':
        role = request.POST.get('role')

        if role == 'teamlead':
            form = TeamLeadForm(request.POST)
        elif role == 'membre':
            form = MembreTechcommandForm(request.POST)
        elif role == 'administrateur':
            form = AdministrateurForm(request.POST)
        else:
            return JsonResponse({'succes': False, 'erreurs': {'role': ['Rôle invalide']}}, status=400)

        if form.is_valid():
            utilisateur = form.save()
            return JsonResponse({'succes': True, 'id': utilisateur.id, 'username': utilisateur.username, 'role': role}, status=201)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


def index(request):
    return render(request, 'index.html')


def login(request):
    return render(request, 'Login.html')


@login_required
def liste_utilisateurs(request):
    if not hasattr(request.user, 'administrateur'):
        return HttpResponseForbidden("Accès réservé aux Administrateurs")

    administrateurs = Administrateur.objects.all()
    teamleads = TeamLead.objects.all()
    membres = MembreTechcommand.objects.all()

    return render(request, 'liste-utilisateurs.html', {
        'administrateurs': administrateurs,
        'teamleads': teamleads,
        'membres': membres,
    })


@login_required
def toggle_statut_utilisateur(request, user_id):
    if not hasattr(request.user, 'administrateur'):
        return JsonResponse({'erreur': 'Accès réservé aux Administrateurs'}, status=403)

    utilisateur = get_object_or_404(Utilisateurs, id=user_id)
    if request.method == 'POST':
        utilisateur.is_active = not utilisateur.is_active
        utilisateur.save()
        return JsonResponse({'succes': True, 'actif': utilisateur.is_active})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_utilisateur(request, user_id):
    if not hasattr(request.user, 'administrateur'):
        return JsonResponse({'erreur': 'Accès réservé aux Administrateurs'}, status=403)

    utilisateur = get_object_or_404(Utilisateurs, id=user_id)
    if request.method == 'POST':
        utilisateur.delete()
        return JsonResponse({'succes': True})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def experiences_membres(request):
    return render(request, 'experiences-membres.html')


@login_required
def liste_feedbacks(request):
    feedbacks = Feedback.objects.all().order_by('-date_soumission')
    return render(request, 'liste-feedbacks.html', {'feedbacks': feedbacks})


@login_required
def liste_plaintes(request):
    plaintes = Plainte.objects.all().order_by('-date_ajout')
    return render(request, 'liste-plaintes.html', {'plaintes': plaintes})


@login_required
def liste_recommandations(request):
    recommandations = Recommandation.objects.all().order_by('-date_soumission')
    return render(request, 'liste-recommandations.html', {'recommandations': recommandations})


@login_required
def ajouter_feedback(request):
    if not hasattr(request.user, 'membretechcommand'):
        return JsonResponse({'erreur': 'Réservé aux Membres Techcommand'}, status=403)

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
            membre=request.user.membretechcommand,
        )

        return JsonResponse({'succes': True, 'description': feedback.description}, status=201)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def ajouter_recommandation(request):
    if not hasattr(request.user, 'membretechcommand'):
        return JsonResponse({'erreur': 'Réservé aux Membres Techcommand'}, status=403)

    if request.method == 'POST':
        form = RecommandationForm(request.POST)
        if form.is_valid():
            recommandation = form.save(commit=False)
            recommandation.membre = request.user.membretechcommand
            recommandation.save()
            return JsonResponse({'succes': True, 'contenu': recommandation.contenu}, status=201)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)
    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def ajouter_plainte(request):
    if not hasattr(request.user, 'membretechcommand'):
        return JsonResponse({'erreur': 'Réservé aux Membres Techcommand'}, status=403)

    if request.method == 'POST':
        form = PlainteForm(request.POST)
        if form.is_valid():
            plainte = form.save(commit=False)
            if not plainte.anonyme:
                plainte.membre = request.user.membretechcommand
            plainte.save()
            return JsonResponse({'succes': True, 'contenu': plainte.contenu}, status=201)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)
    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_feedback(request, feedback_id):
    feedback = get_object_or_404(Feedback, id=feedback_id)
    est_auteur = feedback.membre == getattr(request.user, 'membretechcommand', None)
    if not (hasattr(request.user, 'teamlead') or est_auteur):
        return JsonResponse({'erreur': 'Non autorisé'}, status=403)
    if request.method == 'POST':
        feedback.delete()
        return JsonResponse({'succes': True})
    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_recommandation(request, recommandation_id):
    recommandation = get_object_or_404(Recommandation, id=recommandation_id)
    est_auteur = recommandation.membre == getattr(request.user, 'membretechcommand', None)
    if not (hasattr(request.user, 'teamlead') or est_auteur):
        return JsonResponse({'erreur': 'Non autorisé'}, status=403)

    if request.method == 'POST':
        recommandation.delete()
        return JsonResponse({'succes': True})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def supprimer_plainte(request, plainte_id):
    plainte = get_object_or_404(Plainte, id=plainte_id)
    est_auteur = plainte.membre == getattr(request.user, 'membretechcommand', None)
    if not (hasattr(request.user, 'teamlead') or est_auteur):
        return JsonResponse({'erreur': 'Non autorisé'}, status=403)

    if request.method == 'POST':
        plainte.delete()
        return JsonResponse({'succes': True})

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def ajouter_outil_team(request):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    if request.method == 'POST':
        form = OutilTeamForm(request.POST)
        if form.is_valid():
            outil_team = form.save()
            return JsonResponse({'succes': True, 'id': outil_team.id, 'nom': outil_team.nom}, status=201)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def detail_outil_team(request, team_id):
    equipe = get_object_or_404(OutilTeam, id=team_id)
    return render(request, 'detail_outil_team.html', {'equipe': equipe})


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


@csrf_exempt
def import_tickets_excel(request):
    if request.method == "POST":
        fichier = request.FILES.get("fichier")
        if not fichier:
            return JsonResponse({"erreur": "Aucun fichier reçu"}, status=400)

        wb = load_workbook(fichier, data_only=True)
        ws = wb.active

        count = 0
        for row in ws.iter_rows(min_row=2, values_only=True):
            ticket_id, state, requester, details = row[:4]
            if not ticket_id:
                continue

            Ticket.objects.update_or_create(
                ticket_id=ticket_id,
                defaults={"state": state or "", "requester": requester or "", "details": details or ""}
            )
            count += 1

        return JsonResponse({"message": f"{count} tickets importés"})

    return JsonResponse({"erreur": "Méthode non autorisée"}, status=405)


def export_tickets_excel(request):
    ticket_id = request.GET.get('ticket_id')
    tickets = Ticket.objects.all()
    if ticket_id:
        tickets = tickets.filter(ticket_id=ticket_id)

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
    filename = 'tickets_export.xlsx' if not ticket_id else f'ticket_{ticket_id}.xlsx'
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    wb.save(response)
    return response


def liste_tickets(request):
    qs = list(Ticket.objects.values(
        "ticket_id", "state", "requester", "details", "feedback", "cree_le", "modifie_le"
    ))

    tickets = []
    for t in qs:
        t['cree_le'] = timezone.localtime(t['cree_le']).strftime("%d/%m/%Y %H:%M") if t.get('cree_le') else ""
        t['modifie_le'] = timezone.localtime(t['modifie_le']).strftime("%d/%m/%Y %H:%M") if t.get('modifie_le') else ""
        tickets.append(t)

    return JsonResponse(tickets, safe=False)


@csrf_exempt
def ticket_detail(request, ticket_id):
    if request.method == 'DELETE':
        if not (hasattr(request.user, 'teamlead') or hasattr(request.user, 'membretechcommand')):
            return JsonResponse({"erreur": "Accès interdit"}, status=403)

        try:
            ticket = Ticket.objects.get(ticket_id=ticket_id)
        except Ticket.DoesNotExist:
            return JsonResponse({"erreur": "Ticket introuvable"}, status=404)

        ticket.delete()
        return JsonResponse({"message": "Ticket supprimé"})

    if request.method == 'GET':
        ticket = Ticket.objects.filter(ticket_id=ticket_id).values(
            "ticket_id", "state", "requester", "details", "feedback", "cree_le", "modifie_le"
        ).first()
        if not ticket:
            return JsonResponse({"erreur": "Ticket introuvable"}, status=404)

        ticket['cree_le'] = timezone.localtime(ticket['cree_le']).strftime("%d/%m/%Y %H:%M") if ticket.get('cree_le') else ""
        ticket['modifie_le'] = timezone.localtime(ticket['modifie_le']).strftime("%d/%m/%Y %H:%M") if ticket.get('modifie_le') else ""
        return JsonResponse(ticket, safe=False)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@csrf_exempt
def ajouter_feedback(request, ticket_id):
    if request.method == "POST":
        try:
            ticket = Ticket.objects.get(ticket_id=ticket_id)
        except Ticket.DoesNotExist:
            return JsonResponse({"erreur": "Ticket introuvable"}, status=404)

        import json
        data = json.loads(request.body)
        ticket.feedback = data.get("feedback", "")
        ticket.save()
        return JsonResponse({"message": "Feedback ajouté"})

    return JsonResponse({"erreur": "Méthode non autorisée"}, status=405)
