// true = usa respuestas falsas; cambialo a false cuando el backend este listo
        const USE_MOCKS = true;
        const API_BASE = 'http://localhost:3000/api/v1';
        const TOKEN_KEY = 'cmdb_token';

        const alertBox = document.getElementById('alert');

        function showAlert(message, ok = false) {
            alertBox.textContent = message;
            alertBox.className = 'alert show' + (ok ? ' ok' : '');
        }

        function clearAlert() {
            alertBox.className = 'alert';
            alertBox.textContent = '';
        }

        function clearFieldErrors(form) {
            form.querySelectorAll('[data-error]').forEach(s => (s.textContent = ''));
        }

        // muestra el error del backend (formato de errorhandler: message y errors)
        function showBackendError(err) {
            const list = Array.isArray(err.errors) ? err.errors : [];
            const detalles = list.map(e => (typeof e === 'string' ? e : e.msg || e.message)).filter(Boolean);
            showAlert(detalles.length ? detalles.join(' · ') : (err.message || 'ocurrió un error'));
        }

        // validaciones antes de enviar
        function validate(data, campos) {
            const errores = {};
            if (campos.includes('nombre') && data.nombre.trim().length < 2) errores.nombre = 'el nombre debe tener al menos 2 caracteres';
            if (campos.includes('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errores.email = 'el email no es válido';
            if (campos.includes('password') && data.password.length < 8) errores.password = 'la contraseña debe tener al menos 8 caracteres';
            return errores;
        }

        async function request(path, body) {
            if (USE_MOCKS) return mockRequest(path, body);
            let res;
            try {
                res = await fetch(API_BASE + path, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            } catch {
                throw { message: 'no se pudo conectar con el servidor', errors: [] };
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw data;
            return data;
        }

        // respuestas falsas con la forma acordada en el contrato
        async function mockRequest(path, body) {
            await new Promise(r => setTimeout(r, 300));
            if (path === '/auth/login') {
                if (body.password === 'Mock1234') return { token: 'mock-token' };
                throw { status: 401, message: 'credenciales incorrectas', errors: [] };
            }
            if (path === '/auth/register') {
                if (body.email === 'repetido@mail.com') throw { status: 409, message: 'el email ya está registrado', errors: [] };
                return { user: { nombre: body.nombre } };
            }
            throw { status: 404, message: 'ruta no encontrada', errors: [] };
        }

        function saveToken(token) {
            try { localStorage.setItem(TOKEN_KEY, token); } catch { /* navegador sin almacenamiento */ }
        }

        function setBusy(form, busy) {
            form.querySelector('button[type="submit"]').disabled = busy;
        }

        // pestanas
        document.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === btn));
                document.getElementById('login-form').classList.toggle('active', btn.dataset.tab === 'login');
                document.getElementById('register-form').classList.toggle('active', btn.dataset.tab === 'register');
                clearAlert();
            });
        });

        // login
        document.getElementById('login-form').addEventListener('submit', async e => {
            e.preventDefault();
            const form = e.target;
            clearAlert();
            clearFieldErrors(form);
            const data = Object.fromEntries(new FormData(form));
            const errores = validate(data, ['email', 'password']);
            for (const campo in errores) form.querySelector(`[data-error="${campo}"]`).textContent = errores[campo];
            if (Object.keys(errores).length) return;

            setBusy(form, true);
            try {
                const res = await request('/auth/login', { email: data.email, password: data.password });
                saveToken(res.token);
                window.location.href = 'movies.html';
            } catch (err) {
                showBackendError(err);
            } finally {
                setBusy(form, false);
            }
        });

        // registro
        document.getElementById('register-form').addEventListener('submit', async e => {
            e.preventDefault();
            const form = e.target;
            clearAlert();
            clearFieldErrors(form);
            const data = Object.fromEntries(new FormData(form));
            const errores = validate(data, ['nombre', 'email', 'password']);
            for (const campo in errores) form.querySelector(`[data-error="${campo}"]`).textContent = errores[campo];
            if (Object.keys(errores).length) return;

            setBusy(form, true);
            try {
                await request('/auth/register', { nombre: data.nombre, email: data.email, password: data.password });
                showAlert('cuenta creada, ahora puedes iniciar sesión', true);
                form.reset();
                document.querySelector('.tab[data-tab="login"]').click();
            } catch (err) {
                showBackendError(err);
            } finally {
                setBusy(form, false);
            }
        });