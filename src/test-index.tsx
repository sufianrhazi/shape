import Gooey, { mount } from '@srhazi/gooey';

import testManifest from '../test-manifest.json';

const root = document.getElementById('root');
if (root) {
    mount(
        root,
        <>
            <h1>Index</h1>
            <ul id="index">
                <li>
                    <a
                        href={`/node_modules/@srhazi/gooey-test/dist/testrunner/testrunner.html#${testManifest
                            .map((item) => item.src)
                            .join(':')}`}
                    >
                        Test runner
                    </a>
                </li>
            </ul>
        </>
    );
}
