// true = usa respuestas falsas; cambialo a false cuando el backend este listo
        const USE_MOCKS = true;
        const API_BASE = 'http://localhost:3000/api/v1';
        const USUARIO_ACTUAL = 'Tú'; // en el backend real viene del token

        const alertEl = document.getElementById('alert');
        const movieEl = document.getElementById('movie');
        const reviewsEl = document.getElementById('reviews');
        const form = document.getElementById('review-form');
        const cancelBtn = document.getElementById('cancel-btn');

        const movieId = Number(new URLSearchParams(location.search).get('id'));
        let editingId = null;

        // datos falsos con la forma que devolvera el backend
        const mockDb = {
            peliculas: {
                1: { id: 1, titulo: 'Akira', anio: 1988, categoria: 'Anime', descripcion: 'Neo-Tokio, motos y poderes psíquicos fuera de control.', imagen_url: '', promedio: 8.7 },
                2: { id: 2, titulo: 'Blade Runner', anio: 1982, categoria: 'Ciencia Ficción', descripcion: 'Un cazador de replicantes en un Los Ángeles lluvioso.', imagen_url: '', promedio: 8.1 },
            },
            resenas: [
                { id: 101, pelicula_id: 1, autor: 'Ana', titulo: 'Obra maestra', comentario: 'Visualmente increíble.', calificacion: 9, likes: 4, dislikes: 0 },
                { id: 102, pelicula_id: 1, autor: 'Tú', titulo: 'Muy buena', comentario: 'Un poco confusa al inicio.', calificacion: 8, likes: 1, dislikes: 1 },
                { id: 103, pelicula_id: 2, autor: 'Luis', titulo: 'Clásica', comentario: 'La atmósfera es única.', calificacion: 8, likes: 2, dislikes: 0 },
            ],
        };

        async function request(method, path, body) {
            if (USE_MOCKS) return mockRequest(method, path, body);
            let res;
            try {
                res = await fetch(API_BASE + path, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: body ? JSON.stringify(body) : undefined,
                });
            } catch {
                throw { message: 'no se pudo conectar con el servidor', errors: [] };
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw data;
            return data;
        }

        // simula los endpoints de pelicula y resenas
        async function mockRequest(method, path, body) {
            await new Promise(r => setTimeout(r, 300));
            const pelicula = path.match(/^\/movies\/(\d+)$/);
            if (pelicula && method === 'GET') {
                const p = mockDb.peliculas[pelicula[1]];
                if (!p) throw { status: 404, message: 'película no encontrada', errors: [] };
                return p;
            }
            const reseñasDePelicula = path.match(/^\/movies\/(\d+)\/reviews$/);
            if (reseñasDePelicula && method === 'GET') {
                return { items: mockDb.resenas.filter(r => r.pelicula_id === Number(reseñasDePelicula[1])) };
            }
            if (path === '/reviews' && method === 'POST') {
                const nueva = { id: Date.now(), pelicula_id: movieId, autor: USUARIO_ACTUAL, likes: 0, dislikes: 0, ...body };
                mockDb.resenas.push(nueva);
                return nueva;
            }
            const resena = path.match(/^\/reviews\/(\d+)$/);
            if (resena && method === 'PUT') {
                const r = mockDb.resenas.find(x => x.id === Number(resena[1]));
                if (!r) throw { status: 404, message: 'reseña no encontrada', errors: [] };
                if (r.autor !== USUARIO_ACTUAL) throw { status: 403, message: 'solo el autor puede editar esta reseña', errors: [] };
                Object.assign(r, body);
                return r;
            }
            if (resena && method === 'DELETE') {
                const i = mockDb.resenas.findIndex(x => x.id === Number(resena[1]));
                if (i === -1) throw { status: 404, message: 'reseña no encontrada', errors: [] };
                if (mockDb.resenas[i].autor !== USUARIO_ACTUAL) throw { status: 403, message: 'solo el autor puede eliminar esta reseña', errors: [] };
                mockDb.resenas.splice(i, 1);
                return {};
            }
            throw { status: 404, message: 'ruta no encontrada', errors: [] };
        }

        function escapeHtml(texto) {
            return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        function showAlert(msg, ok = false) {
            alertEl.textContent = msg;
            alertEl.className = 'alert' + (msg ? ' show' : '') + (ok ? ' ok' : '');
        }

        function showBackendError(err) {
            const detalles = (Array.isArray(err.errors) ? err.errors : [])
                .map(e => (typeof e === 'string' ? e : e.msg || e.message)).filter(Boolean);
            showAlert(detalles.length ? detalles.join(' · ') : (err.message || 'ocurrió un error'));
        }

        function renderMovie(p) {
            const poster = p.imagen_url
                ? `<div class="poster" style="background-image:url('${escapeHtml(p.imagen_url)}')"></div>`
                : `<div class="poster">Sin imagen</div>`;
            movieEl.innerHTML = `
                ${poster}
                <div>
                    <h1>${escapeHtml(p.titulo)}</h1>
                    <div class="meta">Año: ${escapeHtml(p.anio)} · Categoría: ${escapeHtml(p.categoria)}</div>
                    <div class="promedio">${escapeHtml(p.promedio.toFixed(1))} / 10</div>
                    <p>${escapeHtml(p.descripcion)}</p>
                </div>`;
        }

        function renderReviews(lista) {
            if (!lista.length) {
                reviewsEl.innerHTML = '<p class="meta">Todavía no hay reseñas.</p>';
                return;
            }
            reviewsEl.innerHTML = lista.map(r => {
                const acciones = r.autor === USUARIO_ACTUAL
                    ? `<div class="review-actions">
                           <button type="button" data-edit="${r.id}">Editar</button>
                           <button type="button" class="danger" data-delete="${r.id}">Eliminar</button>
                       </div>`
                    : '';
                return `
                    <article class="review">
                        <header>
                            <h3>${escapeHtml(r.titulo)}</h3>
                            <span class="cal">${escapeHtml(r.calificacion)} / 10</span>
                        </header>
                        <div class="autor">Por ${escapeHtml(r.autor)} · 👍 ${escapeHtml(r.likes)} · 👎 ${escapeHtml(r.dislikes)}</div>
                        <p>${escapeHtml(r.comentario)}</p>
                        ${acciones}
                    </article>`;
            }).join('');
        }

        async function cargarTodo() {
            try {
                const [pelicula, reseñas] = await Promise.all([
                    request('GET', `/movies/${movieId}`),
                    request('GET', `/movies/${movieId}/reviews`),
                ]);
                renderMovie(pelicula);
                renderReviews(reseñas.items);
            } catch (err) {
                movieEl.innerHTML = '';
                showBackendError(err);
            }
        }

        function limpiarErrores() {
            form.querySelectorAll('[data-error]').forEach(s => (s.textContent = ''));
        }

        function validarResena(data) {
            const errores = {};
            if (!data.titulo.trim()) errores.titulo = 'el título es obligatorio';
            if (!data.comentario.trim()) errores.comentario = 'el comentario es obligatorio';
            const cal = Number(data.calificacion);
            if (!Number.isInteger(cal) || cal < 1 || cal > 10) errores.calificacion = 'la calificación debe estar entre 1 y 10';
            return errores;
        }

        function cargarEnFormulario(r) {
            form.titulo.value = r.titulo;
            form.comentario.value = r.comentario;
            form.calificacion.value = r.calificacion;
            editingId = r.id;
            document.getElementById('form-title').textContent = 'Editar mi reseña';
            document.getElementById('submit-btn').textContent = 'Guardar cambios';
            cancelBtn.hidden = false;
        }

        function salirDeEdicion() {
            editingId = null;
            form.reset();
            document.getElementById('form-title').textContent = 'Escribir reseña';
            document.getElementById('submit-btn').textContent = 'Publicar reseña';
            cancelBtn.hidden = true;
            limpiarErrores();
        }

        form.addEventListener('submit', async e => {
            e.preventDefault();
            showAlert('');
            limpiarErrores();
            const data = Object.fromEntries(new FormData(form));
            const errores = validarResena(data);
            for (const campo in errores) form.querySelector(`[data-error="${campo}"]`).textContent = errores[campo];
            if (Object.keys(errores).length) return;

            const cuerpo = { titulo: data.titulo, comentario: data.comentario, calificacion: Number(data.calificacion) };
            try {
                if (editingId) {
                    await request('PUT', `/reviews/${editingId}`, cuerpo);
                    showAlert('reseña actualizada', true);
                } else {
                    await request('POST', '/reviews', { ...cuerpo, pelicula_id: movieId });
                    showAlert('reseña publicada', true);
                }
                salirDeEdicion();
                cargarTodo();
            } catch (err) {
                showBackendError(err);
            }
        });

        cancelBtn.addEventListener('click', salirDeEdicion);

        reviewsEl.addEventListener('click', async e => {
            const editar = e.target.dataset.edit;
            const eliminar = e.target.dataset.delete;
            if (editar) {
                const r = mockDb.resenas.find(x => x.id === Number(editar)) || {};
                cargarEnFormulario(USE_MOCKS ? r : await request('GET', `/reviews/${editar}`));
                form.scrollIntoView({ behavior: 'smooth' });
            }
            if (eliminar && confirm('¿Eliminar tu reseña?')) {
                try {
                    await request('DELETE', `/reviews/${eliminar}`);
                    showAlert('reseña eliminada', true);
                    cargarTodo();
                } catch (err) {
                    showBackendError(err);
                }
            }
        });

        if (!movieId) {
            movieEl.innerHTML = '';
            showAlert('falta el id de la película en la dirección');
        } else {
            cargarTodo();
        }