from django.shortcuts import render,get_object_or_404,redirect
from .models import OutilMonitoring,Service
from .forms import OutilMonitoringForm,ServiceForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


def liste_outils(request):
    outils = OutilMonitoring.objects.all()
    return render(request, 'liste_outils.html', {'outils': outils})

def detail_outil(request, outil_id):
    outil = get_object_or_404(OutilMonitoring, id=outil_id)
    return render(request, 'detail_outil.html', {'outil': outil})

def liste_services(request):
    services= Service.objects.all()
    return render(request, 'liste_services.html', {'outils': services})


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

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

def supprimer_outil(request, outil_id):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    outil = get_object_or_404(OutilMonitoring, id=outil_id)

    if request.method == 'POST':
        outil.delete()
        return JsonResponse({'succes': True}, status=200)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)



def liste_services(request):
    services = Service.objects.all()
    return render(request, 'liste_services.html', {'services': services})

def liste_services(request):
    services = Service.objects.all()
    tous_les_outils = OutilMonitoring.objects.all()
    return render(request, 'liste_services.html', {'services': services, 'tous_les_outils': tous_les_outils})


def detail_service(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    return render(request, 'detail_service.html', {'service': service})


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


def supprimer_service(request, service_id):
    if not hasattr(request.user, 'teamlead'):
        return JsonResponse({'erreur': 'Accès réservé aux Team-leads'}, status=403)

    service = get_object_or_404(Service, id=service_id)
    if request.method == 'POST':
        service.delete()
        return JsonResponse({'succes': True}, status=200)

    return JsonResponse({'erreur': 'Méthode non autorisée'}, status=405)

def liste_outils(request):
    requete = request.GET.get('q', '')
    outils = OutilMonitoring.objects.filter(nom__icontains=requete) if requete else OutilMonitoring.objects.all()
    return render(request, 'liste_outils.html', {'outils': outils, 'requete': requete})

def liste_services(request):
    requete = request.GET.get('q', '')
    services = Service.objects.filter(nom__icontains=requete) if requete else Service.objects.all()
    tous_les_outils = OutilMonitoring.objects.all()
    return render(request, 'liste_services.html', {'services': services, 'tous_les_outils': tous_les_outils, 'requete': requete})