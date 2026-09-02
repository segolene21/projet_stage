from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from ldap3 import Server, Connection, ALL
from decouple import config

import logging

logger = logging.getLogger(__name__)

User = get_user_model()
#gestion de l'authentification LDAP pour les utilisateurs Active Directory
class ADBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None

        server = Server(config('LDAP_SERVER_URI'), get_info=ALL)
        user_dn = f"{username}@{config('LDAP_DOMAIN')}"

        logger.warning("Attempting LDAP authentication for user: %s", user_dn)

        try:
            conn = Connection(server, user=user_dn, password=password)
            success = conn.bind()
            logger.warning("Bind success: %s", success)
            logger.warning("Bind result détaillé: %s", conn.result)
            if not success:
                return None
        except Exception as e:
            logger.warning("LDAP authentication failed for user: %s", e)
            return None

        logger.warning("LDAP authentication successful for user: %s", conn)
        django_user, created = User.objects.get_or_create(username=username)

        if created:
            django_user.set_unusable_password()
            django_user.save()

        logger.info("User found: %s", django_user)
        conn.unbind()
        return django_user

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None