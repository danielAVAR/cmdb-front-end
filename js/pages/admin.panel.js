// true = usa respuestas falsas; cambialo a false cuando el backend este listo
        const USE_MOCKS = true;
        const API_BASE = 'http://localhost:3000/api/v1';

        const alertEl = document.getElementById('alert');
        const pendientesEl = document.getElementById('pendientes');
        const categoriasEl = document.getElementById('categorias');
        const catForm = document.getElementById('cat-form');
        const catSubmit = document.getElementById('cat-submit');

        let editingCatId = null;

        // datos falsos con la forma que devolvera el backend
        const mockDb = {
            pendientes: [
                { id: 1, titulo: 'Ghost in the Shell', anio: 1995, categoria: 'Ciencia Ficción', enviada_por: 'Ana' },
                { id: 2, titulo: 'Your Name', anio: 2016, categoria: 'Anime', enviada_por: 'Luis' },
            ],
            categorias: [
                { id: 1, nombre: 'Anime', peliculas: 3 },
                { id: 2, nombre: 'Ciencia Ficción', peliculas: 5 },
                { id: 3, nombre: 'Superhéroes', peliculas: 0 },
                { id: 4, nombre: 'Fantasía', peliculas: 2 },
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

        // simula los endpoints de admin
        async function mockRequest(method, path, body) {
            await new Promise(r => setTimeout(r, 300));
            if (path === '/admin/movies/pending' && method === 'GET') return { items: mockDb.pendientes };
            const aprobar = path.match(/^\/admin\/movies\/(\d+)$/);
            if (aprobar && method === 'PATCH') {
                const i = mockDb.pendientes.findIndex(p => p.id === Number(aprobar[1]));
                if (i === -1) throw { status: 404, message: 'película no encontrada', errors: [] };
                mockDb.pendientes.splice(i, 1);
                return { estado: body.estado };
            }
            if (path === '/categories' && method === 'GET') return { items: mockDb.categorias };
            if (path === '/categories' && method === 'POST') {
                if (mockDb.categorias.some(c => c.nombre.toLowerCase() === body.nombre.toLowerCase())) {
                    throw { status: 409, message: 'la categoría ya existe', errors: [] };
                }
                const nueva = { id: Date.now(), nombre: body.nombre, peliculas: 0 };
                mockDb.categorias.push(nueva);
                return nueva;
            }
            const cat = path.match(/^\/categories\/(\d+)$/);
            if (cat && method === 'PUT') {
                const c = mockDb.categorias.find(x => x.id === Number(cat[1]));
                if (!c) throw { status: 404, message: 'categoría no encontrada', errors: [] };
                c.nombre = body.nombre;
                return c;
            }
            if (cat && method === 'DELETE') {
                const c = mockDb.categorias.find(x => x.id === Number(cat[1]));
                if (!c) throw { status: 404, message: 'categoría no encontrada', errors: [] };
                if (c.peliculas > 0) throw { status: 409, message: 'no se puede eliminar una categoría con películas asociadas', errors: [] };
                mockDb.categorias = mockDb.categorias.filter(x => x.id !== c.id);
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

        // muestra el mensaje de error que llega del backend
        function showBackendError(err) {
            const detalles = (Array.isArray(err.errors) ? err.errors : [])
                .map(e => (typeof e === 'string' ? e : e.msg || e.message)).filter(Boolean);
            showAlert(detalles.length ? detalles.join(' · ') : (err.message || 'ocurrió un error'));
        }

        function renderPendientes(lista) {
            pendientesEl.innerHTML = lista.length
                ? lista.map(p => `
                    <div class="item" data-id="${p.id}">
                        <div>
                            <strong>${escapeHtml(p.titulo)}</strong> (${escapeHtml(p.anio)})
                            <div class="info">${escapeHtml(p.categoria)} · enviada por ${escapeHtml(p.enviada_por)}</div>
                        </div>
                        <div class="actions">
                            <button class="approve" type="button" data-accion="publicada">Aprobar</button>
                            <button class="reject" type="button" data-accion="rechazada">Rechazar</button>
                        </div>
                    </div>`).join('')
                : '<p class="empty">No hay películas pendientes.</p>';
        }

        function renderCategorias(lista) {
            categoriasEl.innerHTML = lista.map(c => `
                <div class="item" data-id="${c.id}">
                    <div>
                        <strong>${escapeHtml(c.nombre)}</strong>
                        <div class="info">${escapeHtml(c.peliculas)} películas</div>
                    </div>
                    <div class="actions">
                        <button type="button" data-editar="${c.id}" data-nombre="${escapeHtml(c.nombre)}">Editar</button>
                        <button class="danger" type="button" data-eliminar="${c.id}">Eliminar</button>
                    </div>
                </div>`).join('');
        }

        async function cargarPendientes() {
            try {
                const data = await request('GET', '/admin/movies/pending');
                renderPendientes(data.items);
            } catch (err) {
                showBackendError(err);
            }
        }

        async function cargarCategorias() {
            try {
                const data = await request('GET', '/categories');
                renderCategorias(data.items);
            } catch (err) {
                showBackendError(err);
            }
        }

        function resetCatForm() {
            editingCatId = null;
            catForm.nombre.value = '';
            catSubmit.textContent = 'Crear categoría';
            catForm.querySelector('[data-error]').textContent = '';
        }

        // aprobar o rechazar
        pendientesEl.addEventListener('click', async e => {
            const btn = e.target.closest('button[data-accion]');
            if (!btn) return;
            const id = btn.closest('.item').dataset.id;
            btn.disabled = true;
            try {
                await request('PATCH', `/admin/movies/${id}`, { estado: btn.dataset.accion });
                showAlert(btn.dataset.accion === 'publicada' ? 'película aprobada' : 'película rechazada', true);
                cargarPendientes();
            } catch (err) {
                btn.disabled = false;
                showBackendError(err);
            }
        });

        // editar o eliminar categoria
        categoriasEl.addEventListener('click', async e => {
            const editar = e.target.closest('button[data-editar]');
            const eliminar = e.target.closest('button[data-eliminar]');
            if (editar) {
                editingCatId = editar.dataset.editar;
                catForm.nombre.value = editar.dataset.nombre;
                catSubmit.textContent = 'Guardar cambios';
                catForm.nombre.focus();
            }
            if (eliminar && confirm('¿Eliminar esta categoría?')) {
                try {
                    await request('DELETE', `/categories/${eliminar.dataset.eliminar}`);
                    showAlert('categoría eliminada', true);
                    cargarCategorias();
                } catch (err) {
                    showBackendError(err);
                }
            }
        });

        // crear o actualizar categoria
        catForm.addEventListener('submit', async e => {
            e.preventDefault();
            showAlert('');
            const errorEl = catForm.querySelector('[data-error]');
            errorEl.textContent = '';
            const nombre = catForm.nombre.value.trim();
            if (nombre.length < 2) {
                errorEl.textContent = 'el nombre debe tener al menos 2 caracteres';
                return;
            }
            try {
                if (editingCatId) {
                    await request('PUT', `/categories/${editingCatId}`, { nombre });
                    showAlert('categoría actualizada', true);
                } else {
                    await request('POST', '/categories', { nombre });
                    showAlert('categoría creada', true);
                }
                resetCatForm();
                cargarCategorias();
            } catch (err) {
                showBackendError(err);
            }
        });

        cargarPendientes();
        cargarCategorias();