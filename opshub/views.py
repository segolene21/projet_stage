from django.shortcuts import render,get_object_or_404,redirect
from .models import OutilMonitoring,Service
from django.contrib.auth.decorators import login_required
from .forms import OutilMonitoringForm,ServiceForm,TeamLeadForm,MembreTechcommandForm,AdministrateurForm,OutilTeamForm
from .models import Administrateur, TeamLead, MembreTechcommand, Utilisateurs
from django.http import HttpResponseForbidden, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import MotsClesAssignation, Equipe, MembreTechcommand
from .forms import MotsClesAssignationForm
from .models import Feedback, Recommandation, Plainte, Shift
from .forms import FeedbackForm, RecommandationForm, PlainteForm


@login_required
def liste_outils(request):
    outils = OutilMonitoring.objects.all()
    return render(request, 'liste_outils.html', {'outils': outils})

@login_required
def detail_outil(request, outil_id):
    outil = get_object_or_404(OutilMonitoring, id=outil_id)
    return render(request, 'detail_outil.html', {'outil': outil})

@login_required
def liste_services(request):
    services= Service.objects.all()
    return render(request, 'liste_services.html', {'outils': services})

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
def liste_services(request):
    services = Service.objects.all()
    return render(request, 'liste_services.html', {'services': services})
@login_required
def liste_services(request):
    services = Service.objects.all()
    tous_les_outils = OutilMonitoring.objects.all()
    return render(request, 'liste_services.html', {'services': services, 'tous_les_outils': tous_les_outils})

@login_required
def detail_service(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    return render(request, 'detail_service.html', {'service': service})

@login_required
def ajouter_service(request):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    if request.method == 'POST':
        form = ServiceForm(request.POST)
        if form.is_valid():
            service = form.save()
            return JsonResponse({'succes': True, 'id': service.id, 'nom': service.nom}, status=201)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)

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
def liste_outils(request):
    requete = request.GET.get('q', '')
    outils = OutilMonitoring.objects.filter(nom__icontains=requete) if requete else OutilMonitoring.objects.all()
    return render(request, 'liste_outils.html', {'outils': outils, 'requete': requete})
@login_required
def liste_services(request):
    requete = request.GET.get('q', '')
    services = Service.objects.filter(nom__icontains=requete) if requete else Service.objects.all()
    tous_les_outils = OutilMonitoring.objects.all()
    return render(request, 'liste_services.html', {'services': services, 'tous_les_outils': tous_les_outils, 'requete': requete})

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

from .models import Feedback, Recommandation, Plainte, Shift
from .forms import FeedbackForm, RecommandationForm, PlainteForm
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
            membre=getattr(request.user, 'membretechcommand', None),
        )

        return JsonResponse({'succes': True, 'description': feedback.description}, status=201)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)



@login_required
def ajouter_recommandation(request):
    if request.method == 'POST':
        form = RecommandationForm(request.POST)
        if form.is_valid():
            recommandation = form.save(commit=False)
            recommandation.membre = getattr(request.user, 'membretechcommand', None)
            recommandation.save()
            return JsonResponse({'succes': True, 'contenu': recommandation.contenu}, status=201)
        else:
            return JsonResponse({'succes': False, 'erreurs': form.errors}, status=400)
    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)


@login_required
def ajouter_plainte(request):
    if request.method == 'POST':
        form = PlainteForm(request.POST)
        if form.is_valid():
            plainte = form.save(commit=False)
            if not plainte.anonyme:
                plainte.membre = getattr(request.user, 'membretechcommand', None)
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