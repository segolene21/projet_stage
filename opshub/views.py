from django.shortcuts import render,get_object_or_404,redirect
from .models import OutilMonitoring,Service
from django.contrib.auth.decorators import login_required
from .forms import OutilMonitoringForm,ServiceForm,TeamLeadForm,MembreTechcommandForm,AdministrateurForm
from .models import Administrateur, TeamLead, MembreTechcommand, Utilisateurs
from django.http import HttpResponseForbidden, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import MotsClesAssignation, Equipe, MembreTechcommand
from .forms import MotsClesAssignationForm
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
def index(request):
    return render(request, 'index.html')
def login(request):
    return render(request, 'Login.html')
