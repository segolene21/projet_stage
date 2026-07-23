from django.shortcuts import render
from .models import OutilMonitoring


def liste_outils(request):
    outils = OutilMonitoring.objects.all()
    return render(request, 'liste_outils.html', {'outils': outils})
