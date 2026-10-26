Pod::Spec.new do |s|
  s.name           = 'NuveenAlarm'
  s.version        = '1.0.0'
  s.summary        = 'AlarmKit bridge for Nuveen'
  s.description    = 'Schedules real iOS alarms via AlarmKit, with an NFC-verified re-arm chain.'
  s.author         = ''
  s.homepage       = 'https://github.com/lvcasferrari/Nuveen'
  s.platforms      = { :ios => '26.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
