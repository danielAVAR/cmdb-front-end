// config: true = datos falsos; false = backend real
        const Config = {
            USE_MOCKS: true,
            API_BASE: 'http://localhost:3000/api/v1',
            PAGE_SIZE: 5,
            // retardo simulado para ver los esqueletos
            MOCK_DELAY: 450,
        };

        // modulo: api - una sola funcion para llamar al backend o a los datos falsos
        const Api = {
            // get /movies/top?periodo=mes&limit=5 (pendiente en el backend)
            async getTop(params) {
                if (Config.USE_MOCKS) return Mock.getTop(params);
                const url = Config.API_BASE + '/movies/top?' + new URLSearchParams(params).toString();
                let res;
                try {
                    res = await fetch(url);
                } catch {
                    throw { message: 'no se pudo conectar con el servidor', errors: [] };
                }
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw data;
                return data;
            },

            async getMovies(params) {
                if (Config.USE_MOCKS) return Mock.getMovies(params);
                const url = Config.API_BASE + '/movies?' + new URLSearchParams(params).toString();
                let res;
                try {
                    res = await fetch(url);
                } catch {
                    throw { message: 'no se pudo conectar con el servidor', errors: [] };
                }
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw data;
                return data;
            },
        };

        // modulo: mock - imita la respuesta del endpoint get /movies
        const Mock = {
            categorias: [
                { id: 1, nombre: 'Anime' },
                { id: 2, nombre: 'Ciencia Ficción' },
                { id: 3, nombre: 'Superhéroes' },
                { id: 4, nombre: 'Fantasía' },
            ],
            peliculas: [
                { id: 1, titulo: 'Akira', anio: 1988, categoria: 'Anime', descripcion: 'Neo-Tokio, motos y poderes psíquicos fuera de control.', imagen_url: '', promedio: 8.7, total_resenas: 42, ranking: 1 },
                { id: 2, titulo: 'Blade Runner', anio: 1982, categoria: 'Ciencia Ficción', descripcion: 'Un cazador de replicantes en un Los Ángeles lluvioso.', imagen_url: '', promedio: 8.1, total_resenas: 65, ranking: 2 },
                { id: 3, titulo: 'Spider-Verse', anio: 2018, categoria: 'Superhéroes', descripcion: 'Miles Morales cruza universos para salvar el suyo.', imagen_url: '', promedio: 8.4, total_resenas: 30, ranking: 3 },
                { id: 4, titulo: 'Spirited Away', anio: 2001, categoria: 'Anime', descripcion: 'Chihiro entra a un mundo de espíritus para salvar a sus padres.', imagen_url: '', promedio: 8.6, total_resenas: 58, ranking: 4 },
                { id: 5, titulo: 'El laberinto del fauno', anio: 2006, categoria: 'Fantasía', descripcion: 'Una niña descubre un mundo de criaturas durante la posguerra.', imagen_url: '', promedio: 8.2, total_resenas: 25, ranking: 5 },
                { id: 6, titulo: 'Dark Knight', anio: 2008, categoria: 'Superhéroes', descripcion: 'Batman enfrenta al Joker en Gotham.', imagen_url: '', promedio: 9.0, total_resenas: 80, ranking: 6 },
                { id: 7, titulo: 'Interstellar', anio: 2014, categoria: 'Ciencia Ficción', descripcion: 'Un viaje espacial para salvar a la humanidad.', imagen_url: '', promedio: 8.6, total_resenas: 70, ranking: 7 },
                { id: 8, titulo: 'Howl', anio: 2004, categoria: 'Fantasía', descripcion: 'Sophie cae bajo una maldición y conoce a un mago distraído.', imagen_url: '', promedio: 8.3, total_resenas: 20, ranking: 8 },
                { id: 9, titulo: 'Death Note', anio: 2006, categoria: 'Anime', descripcion: 'Un estudiante encuentra un cuaderno que mata con solo escribir un nombre.', imagen_url: '', promedio: 8.5, total_resenas: 55, ranking: 9 },
                { id: 10, titulo: 'Ready Player One', anio: 2018, categoria: 'Ciencia Ficción', descripcion: 'Una carrera por una fortuna escondida en un mundo virtual.', imagen_url: '', promedio: 7.4, total_resenas: 18, ranking: 10 },
                { id: 11, titulo: 'The Witcher', anio: 2019, categoria: 'Fantasía', descripcion: 'Geralt de Rivia caza monstruos en un mundo medieval.', imagen_url: '', promedio: 8.0, total_resenas: 40, ranking: 11 },
                { id: 12, titulo: 'Avengers', anio: 2012, categoria: 'Superhéroes', descripcion: 'Los héroes más poderosos se unen para enfrentar a Loki.', imagen_url: '', promedio: 8.0, total_resenas: 90, ranking: 12 },
            ],

            async getMovies({ categoria = '', sort = 'ranking', page = 1 }) {
                await new Promise(r => setTimeout(r, Config.MOCK_DELAY));
                if (categoria && !this.categorias.some(c => c.nombre === categoria)) {
                    throw { status: 404, message: 'la categoría no existe', errors: [] };
                }
                let items = this.peliculas.filter(p => !categoria || p.categoria === categoria);
                items = items.sort(sort === 'popularidad'
                    ? (a, b) => b.total_resenas - a.total_resenas
                    : (a, b) => a.ranking - b.ranking);

                const inicio = (Number(page) - 1) * Config.PAGE_SIZE;
                return {
                    items: items.slice(inicio, inicio + Config.PAGE_SIZE),
                    total: items.length,
                    page: Number(page),
                    pages: Math.max(1, Math.ceil(items.length / Config.PAGE_SIZE)),
                    categorias: this.categorias,
                };
            },

            // simula el top del mes: mejor promedio entre peliculas con minimo de resenas
            async getTop({ periodo = 'mes', limit = 5 } = {}) {
                await new Promise(r => setTimeout(r, Config.MOCK_DELAY));
                if (periodo !== 'mes') throw { status: 400, message: 'periodo no valido', errors: [] };
                const minimo = 20;
                const items = this.peliculas
                    .filter(p => p.total_resenas >= minimo)
                    .sort((a, b) => b.promedio - a.promedio)
                    .slice(0, Number(limit))
                    .map(p => ({ ...p, resenas_periodo: Math.max(1, Math.round(p.total_resenas * 0.3)) }));
                return { periodo, items };
            },
        };

        // modulo: utils
        const Utils = {
            escape(texto) {
                return String(texto ?? '').replace(/[&<>"']/g, c => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
                }[c]));
            },
            // convierte el promedio (0 a 10) en 5 estrellas
            stars(promedio) {
                const llenas = Math.round(promedio / 2);
                return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
            },
            // tono de color estable por pelicula para el poster sin imagen
            hue(id) {
                return (id * 47) % 360;
            },
            reducedMotion() {
                return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            },
        };

        // modulo: render - dibuja esqueletos, filas y paginacion
        const Render = {
            el: {
                list: document.getElementById('list'),
                count: document.getElementById('count'),
                pageInfo: document.getElementById('page-info'),
                prev: document.getElementById('prev'),
                next: document.getElementById('next'),
                categoria: document.getElementById('categoria'),
                alert: document.getElementById('alert'),
            },

            skeletons(n = Config.PAGE_SIZE) {
                this.el.list.setAttribute('aria-busy', 'true');
                this.el.list.innerHTML = Array.from({ length: n }, () => '<div class="skeleton" aria-hidden="true"></div>').join('');
            },

            row(p, i) {
                const poster = p.imagen_url
                    ? `<div class="poster" style="background-image:url('${Utils.escape(p.imagen_url)}')"></div>`
                    : `<div class="poster fallback" style="--h:${Utils.hue(p.id)}"><span>${Utils.escape(p.titulo.charAt(0))}</span></div>`;

                return `
                    <a class="movie-row" href="movie_detalles.html?id=${p.id}" style="--i:${i}" data-id="${p.id}">
                        ${poster}
                        <div class="center">
                            <h2>${Utils.escape(p.titulo)}</h2>
                            <div class="meta">
                                <strong>Año</strong> ${Utils.escape(p.anio)}<br>
                                <strong>Categoría</strong> ${Utils.escape(p.categoria)}
                            </div>
                        </div>
                        <div class="right">
                            <p>${Utils.escape(p.descripcion)}</p>
                            <div class="stars" aria-label="${Utils.escape(p.promedio.toFixed(1))} de 10">${Utils.stars(p.promedio)}</div>
                            <div class="stats">
                                Promedio <strong>${Utils.escape(p.promedio.toFixed(1))} / 10</strong><br>
                                ${Utils.escape(p.total_resenas)} reseñas · Puesto #${Utils.escape(p.ranking)}
                            </div>
                        </div>
                    </a>`;
            },

            list(items) {
                this.el.list.setAttribute('aria-busy', 'false');
                if (!items.length) {
                    this.el.list.innerHTML = '<p class="empty">No hay películas para este filtro.</p>';
                    return;
                }
                this.el.list.innerHTML = items.map((p, i) => this.row(p, i)).join('');
                Reveal.observeAll(this.el.list.querySelectorAll('.movie-row'));
            },

            categorias(lista) {
                if (this.el.categoria.options.length > 1) return; // ya cargadas
                this.el.categoria.innerHTML = '<option value="">Todas las categorías</option>' +
                    lista.map(c => `<option value="${Utils.escape(c.nombre)}">${Utils.escape(c.nombre)}</option>`).join('');
            },

            top(data) {
                const grid = document.getElementById('top-grid');
                document.getElementById('top-periodo').textContent = data.periodo === 'mes' ? 'de este mes' : '';
                grid.setAttribute('aria-busy', 'false');
                grid.innerHTML = data.items.map((p, i) => `
                    <a class="top-card" href="movie_detalles.html?id=${p.id}" style="--i:${i}">
                        <span class="top-num" aria-hidden="true">${i + 1}</span>
                        <h3>${Utils.escape(p.titulo)}</h3>
                        <div class="stars" aria-label="${Utils.escape(p.promedio.toFixed(1))} de 10">${Utils.stars(p.promedio)}</div>
                        <div class="meta">
                            <strong>${Utils.escape(p.promedio.toFixed(1))}</strong> / 10<br>
                            ${Utils.escape(p.resenas_periodo)} reseñas este mes
                        </div>
                    </a>`).join('');
                // mismo efecto de aparicion que las filas
                grid.querySelectorAll('.top-card').forEach(c => {
                    if (Utils.reducedMotion()) c.classList.add('in');
                    else requestAnimationFrame(() => c.classList.add('in'));
                });
            },

            topError(msg) {
                const grid = document.getElementById('top-grid');
                grid.setAttribute('aria-busy', 'false');
                grid.innerHTML = `<p class="empty" style="grid-column:1/-1;padding:0">${Utils.escape(msg)}</p>`;
            },

            pager(data) {
                this.el.count.textContent = `${data.total} películas`;
                this.el.pageInfo.textContent = `Página ${data.page} de ${data.pages}`;
                this.el.prev.disabled = data.page <= 1;
                this.el.next.disabled = data.page >= data.pages;
            },

            alert(msg) {
                this.el.alert.textContent = msg;
                this.el.alert.classList.toggle('show', Boolean(msg));
            },

            // quita las filas actuales con animacion antes de pintar las nuevas
            async fadeOut() {
                const filas = this.el.list.querySelectorAll('.movie-row');
                if (!filas.length || Utils.reducedMotion()) return;
                filas.forEach(f => f.classList.add('out'));
                await new Promise(r => setTimeout(r, 250));
            },
        };

        // modulo: reveal - fade-in-up escalonado con intersectionobserver
        const Reveal = {
            observer: 'IntersectionObserver' in window
                ? new IntersectionObserver((entradas, obs) => {
                    entradas.forEach(e => {
                        if (e.isIntersecting) {
                            e.target.classList.add('in');
                            obs.unobserve(e.target);
                        }
                    });
                }, { threshold: 0.15 })
                : null,

            observeAll(nodos) {
                nodos.forEach(n => {
                    // sin soporte o con movimiento reducido, se muestra de una vez
                    if (!this.observer || Utils.reducedMotion()) n.classList.add('in');
                    else this.observer.observe(n);
                });
            },
        };

        // modulo: nav - vidrio esmerilado al hacer scroll
        const Nav = {
            init() {
                const nav = document.getElementById('nav');
                const actualizar = () => nav.classList.toggle('scrolled', window.scrollY > 24);
                window.addEventListener('scroll', actualizar, { passive: true });
                actualizar();
            },
        };

        // modulo: app - conecta filtros, paginacion y carga
        const App = {
            state: { categoria: '', orden: 'ranking', page: 1 },
            cargando: false,

            async cargar() {
                if (this.cargando) return;
                this.cargando = true;
                Render.alert('');
                await Render.fadeOut();
                Render.skeletons();

                try {
                    const data = await Api.getMovies({
                        categoria: this.state.categoria,
                        sort: this.state.orden,
                        page: this.state.page,
                    });
                    Render.categorias(data.categorias || []);
                    Render.list(data.items);
                    Render.pager(data);
                } catch (err) {
                    Render.el.list.innerHTML = '';
                    Render.el.list.setAttribute('aria-busy', 'false');
                    Render.alert(err.message || 'no se pudieron cargar las películas');
                } finally {
                    this.cargando = false;
                }
            },

            async cargarTop() {
                try {
                    const data = await Api.getTop({ periodo: 'mes', limit: 5 });
                    Render.top(data);
                } catch (err) {
                    Render.topError(err.message || 'no se pudo cargar el top del mes');
                }
            },

            bind() {
                Render.el.categoria.addEventListener('change', e => {
                    this.state.categoria = e.target.value;
                    this.state.page = 1;
                    this.cargar();
                });
                document.getElementById('orden').addEventListener('change', e => {
                    this.state.orden = e.target.value;
                    this.state.page = 1;
                    this.cargar();
                });
                Render.el.prev.addEventListener('click', () => { this.state.page -= 1; this.cargar(); });
                Render.el.next.addEventListener('click', () => { this.state.page += 1; this.cargar(); });
            },

            init() {
                Nav.init();
                this.bind();
                this.cargarTop();
                this.cargar();
            },
        };

        App.init();