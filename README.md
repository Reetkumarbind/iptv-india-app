<h1 data-start="233" data-end="249">IPTV India App</h1>
<p data-start="251" data-end="426">A simple web-based IPTV player that streams Indian TV channels using M3U playlists.<br data-start="334" data-end="337" /> This project is designed to be <strong data-start="368" data-end="425">lightweight, static, and easily deployable on Netlify</strong>.</p>
Demo: https://iptv-india-app.netlify.app
<h2 data-start="433" data-end="444">Features</h2>
<ul data-start="446" data-end="618">
<li data-start="446" data-end="469">
<p data-start="448" data-end="469">Web-based IPTV player</p>
</li>
<li data-start="446" data-end="469">
<p data-start="448" data-end="469">Supports M3U playlist files</p>
</li>
<li data-start="500" data-end="545">
<p data-start="502" data-end="545">Responsive UI (works on desktop and mobile)</p>
</li>
<li data-start="546" data-end="586">
<p data-start="548" data-end="586">No backend required (100% static site)</p>
</li>
<li data-start="587" data-end="618">
<p data-start="589" data-end="618">Easy deployment using Netlify</p>
</li>
</ul>
<h2 data-start="625" data-end="638">Tech Stack</h2>
<ul data-start="640" data-end="708">
<li data-start="640" data-end="646">
<p data-start="642" data-end="646">HTML</p>
</li>
<li data-start="647" data-end="652">
<p data-start="649" data-end="652">CSS</p>
</li>
<li data-start="653" data-end="665">
<p data-start="655" data-end="665">JavaScript</p>
</li>
<li data-start="666" data-end="688">
<p data-start="668" data-end="688">M3U playlist support</p>
</li>
<li data-start="689" data-end="708">
<p data-start="691" data-end="708">Netlify (hosting)</p>
</li>
</ul>
<h2 data-start="715" data-end="735">Project Structure</h2>
<p>iptv-india-app/<br />│<br />├── index.html # Main application entry<br />├── css/ # Stylesheets<br />├── js/ # JavaScript logic<br />├── assets/ # Images / icons (if any)<br />├── playlist.m3u # IPTV playlist (example)<br />└── README.md</p>
<h2 data-start="1007" data-end="1023">Prerequisites</h2>
<ul data-start="1025" data-end="1112">
<li data-start="1025" data-end="1043">
<p data-start="1027" data-end="1043">A GitHub account</p>
</li>
<li data-start="1044" data-end="1063">
<p data-start="1046" data-end="1063">A Netlify account</p>
</li>
<li data-start="1064" data-end="1112">
<p data-start="1066" data-end="1112">Basic understanding of Git and static websites</p>
</li>
</ul>
<h2 data-start="1119" data-end="1158">Deployment on Netlify (Step-by-Step)</h2>
<h3 data-start="1160" data-end="1195">1. Fork or Clone the Repository</h3>
<div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary">
<div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9">&nbsp;</div>
<div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash">git <span class="hljs-built_in">clone</span> https://github.com/ipradipnalwaya/iptv-india-app.git <span class="hljs-built_in">cd</span> iptv-india-app </code></div>
</div>
<p data-start="1291" data-end="1339">Push it to your own GitHub repository if needed.</p>
<h3 data-start="1346" data-end="1369">2. Login to Netlify</h3>
<ul data-start="1371" data-end="1424">
<li data-start="1371" data-end="1402">
<p data-start="1373" data-end="1402">Go to <a class="decorated-link" href="https://www.netlify.com" target="_new" rel="noopener" data-start="1379" data-end="1402">https://www.netlify.com</a></p>
</li>
<li data-start="1403" data-end="1424">
<p data-start="1405" data-end="1424">Log in using GitHub</p>
</li>
</ul>
<hr data-start="1426" data-end="1429" />
<h3 data-start="1431" data-end="1455">3. Create a New Site</h3>
<ol data-start="1457" data-end="1590">
<li data-start="1457" data-end="1484">
<p data-start="1460" data-end="1484">Click <strong data-start="1466" data-end="1484">"Add new site"</strong></p>
</li>
<li data-start="1485" data-end="1527">
<p data-start="1488" data-end="1527">Select <strong data-start="1495" data-end="1527">"Import an existing project"</strong></p>
</li>
<li data-start="1528" data-end="1548">
<p data-start="1531" data-end="1548">Choose <strong data-start="1538" data-end="1548">GitHub</strong></p>
</li>
<li data-start="1549" data-end="1590">
<p data-start="1552" data-end="1590">Select the <code data-start="1563" data-end="1579">iptv-india-app</code> repository</p>
</li>
</ol>
<h3 data-start="1597" data-end="1628">4. Configure Build Settings</h3>
<p data-start="1630" data-end="1657">Use the following settings:</p>
<div class="TyagGW_tableContainer">
<div class="group TyagGW_tableWrapper flex flex-col-reverse w-fit" tabindex="-1">
<table class="w-fit min-w-(--thread-content-width)" data-start="1659" data-end="1870">
<thead data-start="1659" data-end="1700">
<tr data-start="1659" data-end="1700">
<th data-start="1659" data-end="1680" data-col-size="sm">Setting</th>
<th data-start="1680" data-end="1700" data-col-size="sm">Value</th>
</tr>
</thead>
<tbody data-start="1743" data-end="1870">
<tr data-start="1743" data-end="1784">
<td data-start="1743" data-end="1764" data-col-size="sm">Build command</td>
<td data-start="1764" data-end="1784" data-col-size="sm"><em data-start="1766" data-end="1781">(leave empty)</em></td>
</tr>
<tr data-start="1785" data-end="1826">
<td data-start="1785" data-end="1806" data-col-size="sm">Publish directory</td>
<td data-start="1806" data-end="1826" data-col-size="sm"><code data-start="1808" data-end="1811">/</code></td>
</tr>
<tr data-start="1827" data-end="1870">
<td data-start="1827" data-end="1848" data-col-size="sm">Branch</td>
<td data-start="1848" data-end="1870" data-col-size="sm"><code data-start="1850" data-end="1856">main</code> (or master)</td>
</tr>
</tbody>
</table>
</div>
</div>
<p data-start="1872" data-end="1934">Since this is a static site, <strong data-start="1901" data-end="1933">no build command is required</strong>.</p>
<hr data-start="1936" data-end="1939" />
<h3 data-start="1941" data-end="1954">5. Deploy</h3>
<ul data-start="1956" data-end="2101">
<li data-start="1956" data-end="1979">
<p data-start="1958" data-end="1979">Click <strong data-start="1964" data-end="1979">Deploy site</strong></p>
</li>
<li data-start="1980" data-end="2019">
<p data-start="1982" data-end="2019">Wait for Netlify to finish deployment</p>
</li>
<li data-start="2020" data-end="2101">
<p data-start="2022" data-end="2101">You will receive a live Netlify URL (e.g. <code data-start="2064" data-end="2100">https://your-site-name.netlify.app</code>)</p>
</li>
</ul>
<hr data-start="2103" data-end="2106" />
<h2 data-start="2108" data-end="2139">Local Development (Optional)</h2>
<p data-start="2141" data-end="2193">You can run the app locally using any static server.</p>
<h3 data-start="2195" data-end="2224">Using VS Code Live Server</h3>
<ul data-start="2225" data-end="2322">
<li data-start="2225" data-end="2260">
<p data-start="2227" data-end="2260">Install <strong data-start="2235" data-end="2250">Live Server</strong> extension</p>
</li>
<li data-start="2261" data-end="2287">
<p data-start="2263" data-end="2287">Right-click <code data-start="2275" data-end="2287">index.html</code></p>
</li>
<li data-start="2288" data-end="2322">
<p data-start="2290" data-end="2322">Select <strong data-start="2297" data-end="2322">Open with Live Server</strong></p>
</li>
</ul>
<h3 data-start="2324" data-end="2340">Using Python</h3>
<div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary">
<div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9">&nbsp;</div>
<div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash">python -m http.server 8080 </code></div>
</div>
<p data-start="2380" data-end="2390">Then open:</p>
<div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary">
<div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9">&nbsp;</div>
<div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!">http:<span class="hljs-comment">//localhost:8080</span> </code></div>
</div>
<hr data-start="2422" data-end="2425" />
<h2 data-start="2427" data-end="2452">Playlist Configuration</h2>
<ul data-start="2454" data-end="2642">
<li data-start="2454" data-end="2516">
<p data-start="2456" data-end="2516">Update or replace <code data-start="2474" data-end="2488">playlist.m3u</code> with your own IPTV playlist</p>
</li>
<li data-start="2517" data-end="2574">
<p data-start="2519" data-end="2574">Ensure URLs inside the playlist are publicly accessible</p>
</li>
<li data-start="2575" data-end="2642">
<p data-start="2577" data-end="2642">Some streams may require CORS-enabled sources to work in browsers</p>
</li>
</ul>
<hr data-start="2644" data-end="2647" />
<h2 data-start="2649" data-end="2667">Important Notes</h2>
<ul data-start="2669" data-end="2866">
<li data-start="2669" data-end="2714">
<p data-start="2671" data-end="2714">This project does <strong data-start="2689" data-end="2714">not host IPTV content</strong></p>
</li>
<li data-start="2715" data-end="2797">
<p data-start="2717" data-end="2797">You are responsible for ensuring you have the legal right to stream any channels</p>
</li>
<li data-start="2798" data-end="2866">
<p data-start="2800" data-end="2866">Some IPTV streams may not work due to browser or CORS restrictions</p>
</li>
</ul>
<hr data-start="2868" data-end="2871" />
<h2 data-start="2873" data-end="2889">Common Issues</h2>
<h3 data-start="2891" data-end="2921">Blank Player / No Playback</h3>
<ul data-start="2922" data-end="3035">
<li data-start="2922" data-end="2957">
<p data-start="2924" data-end="2957">Stream URL may be blocked by CORS</p>
</li>
<li data-start="2958" data-end="2998">
<p data-start="2960" data-end="2998">Stream format not supported by browser</p>
</li>
<li data-start="2999" data-end="3035">
<p data-start="3001" data-end="3035">Playlist URL is invalid or expired</p>
</li>
</ul>
<h3 data-start="3037" data-end="3073">Works Locally but Not on Netlify</h3>
<ul data-start="3074" data-end="3129">
<li data-start="3074" data-end="3102">
<p data-start="3076" data-end="3102">Hardcoded <code data-start="3086" data-end="3097">localhost</code> URLs</p>
</li>
<li data-start="3103" data-end="3129">
<p data-start="3105" data-end="3129">Incorrect relative paths</p>
</li>
</ul>
<hr data-start="3131" data-end="3134" />
<h2 data-start="3136" data-end="3146">License</h2>
<p data-start="3148" data-end="3274">This project is provided for <strong data-start="3177" data-end="3214">educational and personal use only</strong>.<br data-start="3215" data-end="3218" /> Please comply with local laws and streaming regulations.</p>
<hr data-start="3276" data-end="3279" />
<h2 data-start="3281" data-end="3290">Author</h2>
<p><strong data-start="3292" data-end="3310">Reet Kumar Bind</strong></p>
