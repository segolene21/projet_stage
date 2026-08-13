from functools import wraps
from django.http import JsonResponse, HttpResponseForbidden
from django.contrib.auth.views import redirect_to_login

def permission_requise(code_permission, is_json=True):
    """
    Décorateur personnalisé pour vérifier si un utilisateur possède une permission.
    - is_json=True (par défaut) : renvoie une erreur JSON 401 ou 403 (idéal pour AJAX).
    - is_json=False : redirige vers la page de login ou renvoie une erreur 403 HTML.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # 1. Authentification
            if not request.user.is_authenticated:
                if is_json:
                    return JsonResponse({'erreur': 'Authentification requise'}, status=401)
                return redirect_to_login(request.get_full_path())

            # 2. Permission
            if not request.user.a_la_permission(code_permission):
                if is_json:
                    return JsonResponse({'erreur': f'Permission insuffisante ({code_permission})'}, status=403)
                return HttpResponseForbidden("Accès refusé : vous n'avez pas la permission nécessaire.")

            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator